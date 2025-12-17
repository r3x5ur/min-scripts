> 本文由 [简悦 SimpRead](http://ksria.com/simpread/) 转码， 原文地址 [mp.weixin.qq.com](https://mp.weixin.qq.com/s/s5MKu6-Cy-IRHiIQOP8phA)

一、样本基本信息
========

包名：com.max.xiaoheihe

接口信息：https://api.xiaoheihe.cn/account/login  登陆的接口

样本：小黑盒

📎xhh.zip

![](https://mmbiz.qpic.cn/mmbiz_png/fj9hsKCs4SHkHedTh5nuPQbkbZZ59AojaDo8E971KwDwf6O4xchkHkwmjpqZ3KKtvtaYsqvlBXT0D80TOJ7ydQ/640?wx_fmt=png&from=appmsg&watermark=1#imgIndex=0)

目标参数信息：请求头 noce

![](https://mmbiz.qpic.cn/mmbiz_png/fj9hsKCs4SHkHedTh5nuPQbkbZZ59Aoj81cTZwapwbQHRV13vPK9SMkKGSosAm4OHP49XiaS1vAvqiaicqlYBgRLg/640?wx_fmt=png&from=appmsg&watermark=1#imgIndex=1)

二、frida 检测处理
============

先随意写一个脚本注入，用来测试 firda 是否有被检测

```
function java_hook() {
  Java.perform(function () {
    console.log("java_hook")
  })
}

```

![](https://mmbiz.qpic.cn/mmbiz_png/fj9hsKCs4SHkHedTh5nuPQbkbZZ59AojnOwglrvicKTrhq6eTNRojYbWMtFALDFJxficxmiaSgnx85HX7J5aqvszg/640?wx_fmt=png&from=appmsg&watermark=1#imgIndex=2)

可以看到手机上正常进入，但是 frida 进程已经被杀死了，有明显的进程检测的特征，我们还是先看看是哪一个 so 文件加载的线程导致杀死了 frida

```
function hook_dlopen() {
  var android_dlopen_ext = Module.findExportByName(null, "android_dlopen_ext");
  console.log("addr_android_dlopen_ext", android_dlopen_ext);
  Interceptor.attach(android_dlopen_ext, {
    onEnter: function (args) {
      var pathptr = args[0];
      if (pathptr != null && pathptr != undefined) {
        var path = ptr(pathptr).readCString();
        console.log("android_dlopen_ext:", path)


      }
    },
    onLeave: function (retvel) {
    }
  })
}

```

![](https://mmbiz.qpic.cn/mmbiz_png/fj9hsKCs4SHkHedTh5nuPQbkbZZ59AojFlC6oEr3bjYSxZMO38rEHXOCiaKC6P7db893vicK7dicaCaLvozVTxibug/640?wx_fmt=png&from=appmsg&watermark=1#imgIndex=3)

firda 在加载到 libmsaoaidsec.so 文件的时候将 frida 进程杀死，去打印线程的加载情况，libmsaoaidsec.so 加载了哪些线程信息

![](https://mmbiz.qpic.cn/mmbiz_png/fj9hsKCs4SHkHedTh5nuPQbkbZZ59AojQQ6xCLqIdgibq6kTRiba8WoEU9esESccibqzZGJ1PqsoF4myjQFM29doA/640?wx_fmt=png&from=appmsg&watermark=1#imgIndex=4)

产生了两个线程，将这两个线程给置空

```
function patch_func_nop(addr) {
  Memory.patchCode(addr, 8, function (code) {
    code.writeByteArray([0xE0, 0x03, 0x00, 0xAA]);
    code.writeByteArray([0xC0, 0x03, 0x5F, 0xD6]);
  });
}

function hook_pth() {
  var pth_create = Module.findExportByName("libc.so", "pthread_create");
  console.log("[pth_create]", pth_create);
  Interceptor.attach(pth_create, {
    onEnter: function (args) {
      var module = Process.findModuleByAddress(args[2]);
      if (module != null) {
        console.log("开启线程-->", module.name, args[2].sub(module.base));
        if (module.name.indexOf("libmsaoaidsec.so") != -1) {
          patch_func_nop(module.base.add(0x1c544));
          patch_func_nop(module.base.add(0x1b8d4));
          // patch_func_nop(module.base.add(0x26e5c));
        }

      }

    },
    onLeave: function (retval) {
    }
  });

}

function hook_remove(so_name) {
  Interceptor.attach(Module.findExportByName(null, "android_dlopen_ext"), {
    onEnter: function (args) {
      var pathptr = args[0];
      if (pathptr !== undefined && pathptr != null) {
        var path = ptr(pathptr).readCString();
        if (args[0].readCString() != null && args[0].readCString().indexOf("libmsaoaidsec.so") >= 0) {
          hook_pth()
        }
      }
    },
    onLeave: function (retval) {
    }
  });
}

function main() {
    hook_remove('libmsaoaidsec.so')
}

setImmediate(main)

```

![](https://mmbiz.qpic.cn/mmbiz_png/fj9hsKCs4SHkHedTh5nuPQbkbZZ59AojERznjN17fIcykHdEZHJ97lQrwLOzVspNEvUSouOvm3TUIB0mZmZ6fA/640?wx_fmt=png&from=appmsg&watermark=1#imgIndex=5)

这样就可以过掉 frida 检测

三、java 层分析
==========

![](https://mmbiz.qpic.cn/mmbiz_png/fj9hsKCs4SHkHedTh5nuPQbkbZZ59Aoj976X8W9ngETexAlJDdvgic1K0BBuYaxc5QlMWeeDj4swUGaFWEa6s8w/640?wx_fmt=png&from=appmsg&watermark=1#imgIndex=6)![](https://mmbiz.qpic.cn/mmbiz_png/fj9hsKCs4SHkHedTh5nuPQbkbZZ59Aoj6aQeYa3PLjw0vGPBibMI4MdMSoLZk1WAibvoHJGdHIcxuicG06ej9S6fQ/640?wx_fmt=png&from=appmsg&watermark=1#imgIndex=7)

 noce 关键词是搜不到的，参考之前的经验，我直接搜索了接口，因为在资源目录看到了 okhttp 框架

![](https://mmbiz.qpic.cn/mmbiz_png/fj9hsKCs4SHkHedTh5nuPQbkbZZ59AojQvShCReoQULsK3XLzpEabZsJ50Plhq0xyhicib70Npa28Rou0ewWmc7A/640?wx_fmt=png&from=appmsg&watermark=1#imgIndex=8)

删删改改，通过这个搜索看到了接口信息

![](https://mmbiz.qpic.cn/mmbiz_png/fj9hsKCs4SHkHedTh5nuPQbkbZZ59AojyUBIfVjbSNgdb59DCGjKjlMwhK09ibxGM6Cpbmc6ufDT3yYrK7OX6mA/640?wx_fmt=png&from=appmsg&watermark=1#imgIndex=9)

这里的话看到接口传入了两个参数，一个是登录的电话号码，一个是密码，但是没有找到请求头和载荷的入参，去看看这个 a0 的调用

![](https://mmbiz.qpic.cn/mmbiz_png/fj9hsKCs4SHkHedTh5nuPQbkbZZ59AojegCyxMpOrjPpChpibvW35VHxy3vg6jbFrEoy9dSC4p6AgqjfFmia568A/640?wx_fmt=png&from=appmsg#imgIndex=10)

可以大致看到这里就是单纯的对账号密码进行一个拼接，取值的处理，然后送到 a 函数里面进行加密处理，跟进去看看

![](https://mmbiz.qpic.cn/mmbiz_png/fj9hsKCs4SHkHedTh5nuPQbkbZZ59Aoj3Cv46k8wxmCOMuDEH2V1jfBxuE1OrJlQyclW73hIewibIP5ynpk3hlw/640?wx_fmt=png&from=appmsg&watermark=1#imgIndex=11)

没有混淆的 RSA 加密，很清晰的看出来，同时请求里面也可以看到手机号码和密码都是加密了的，这个不是重点。

通过 ai 搜了一下同时花哥的指导，这是一个 Retrofit 框架框架，它是通过拦截器去添加请求头和载荷的，通过 hook getBytes 来找到生成位置堆栈信息

```
function sting_put() {
  Java.perform(function () {
    var StringClass = Java.use('java.lang.String');
    // 1.  Hook 带字符集名称的 getBytes(String charsetName) 方法（入参为字符集名称）
    StringClass.getBytes.overload('java.lang.String').implementation = function () {
      console.log('\n[Hook] String.getBytes() 被调用');
      console.log('  字符串内容: ' + this.toString()); // 打印当前字符串
      console.log('  调用栈:');
      console.log(Java.use('android.util.Log').getStackTraceString(Java.use('java.lang.Exception').$new())); // 打印调用栈
      return this.getBytes();
    };
    // 2. Hook 带 Charset 类型的 getBytes(Charset charset) 方法（入参为Charset对象）
    StringClass.getBytes.overload('java.nio.charset.Charset').implementation = function (charset) {
      console.log('\n[Hook] String.getBytes(Charset) 被调用');
      console.log('  入参 charset: ' + (charset ? charset.displayName() : 'null')); // 打印Charset信息
      console.log('  字符串内容: ' + this.toString());
      console.log('  调用栈:');
      console.log(Java.use('android.util.Log').getStackTraceString(Java.use('java.lang.Exception').$new()));
      return this.getBytes(charset);
    };
  });
}

```

```
[Hook] String.getBytes() 被调用
  字符串内容: G2ofqaYm0jvf6szXT5uimbMQiWpyWtCR
  调用栈:
java.lang.Exception
    at java.lang.String.getBytes(Native Method)
    at com.max.security.SecurityTool.getVD(Native Method)
    at com.max.xiaoheihe.router.serviceimpl.i.b(RequestInterceptImpl.java:7)
    at com.max.hbcommon.network.b.h(ApiModule.java:13)
    at com.max.hbcommon.network.b$a.intercept(Unknown Source:35)
    at okhttp3.internal.http.RealInterceptorChain.proceed(RealInterceptorChain.kt:12)
    at okhttp3.internal.connection.RealCall.getResponseWithInterceptorChain$okhttp(RealCall.kt:16)
    at okhttp3.internal.connection.RealCall.execute(RealCall.kt:5)
    at retrofit2.l.execute(OkHttpCall.java:8)
    at retrofit2.adapter.rxjava2.c.H5(CallExecuteObservable.java:5)
    at io.reactivex.z.f(Observable.java:4)
    at retrofit2.adapter.rxjava2.a.H5(Unknown Source:7)
    at io.reactivex.z.f(Observable.java:4)
    at io.reactivex.internal.operators.observable.ObservableSubscribeOn$a.run(Unknown Source:6)
    at io.reactivex.h0$a.run(Scheduler.java:2)
    at io.reactivex.internal.schedulers.ScheduledRunnable.run(ScheduledRunnable.java:2)
    at io.reactivex.internal.schedulers.ScheduledRunnable.call(Unknown Source:0)
    at java.util.concurrent.FutureTask.run(FutureTask.java:266)
    at java.util.concurrent.ScheduledThreadPoolExecutor$ScheduledFutureTask.run(ScheduledThreadPoolExecutor.java:301)
    at java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1167)
    at java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:641)
    at java.lang.Thread.run(Thread.java:920)

1759752514
jalxpCVnrJIcUaXpu8Awn8I5UYgfFifF

[Hook] String.getBytes() 被调用
  字符串内容: jalxpCVnrJIcUaXpu8Awn8I5UYgfFifF
  调用栈:
java.lang.Exception
    at java.lang.String.getBytes(Native Method)
    at com.max.security.SecurityTool.setKN(Native Method)
    at com.max.xiaoheihe.router.serviceimpl.i.b(RequestInterceptImpl.java:11)
    at com.max.hbcommon.network.b.h(ApiModule.java:13)
    at com.max.hbcommon.network.b$a.intercept(Unknown Source:35)
    at okhttp3.internal.http.RealInterceptorChain.proceed(RealInterceptorChain.kt:12)
    at okhttp3.internal.connection.RealCall.getResponseWithInterceptorChain$okhttp(RealCall.kt:16)
    at okhttp3.internal.connection.RealCall.execute(RealCall.kt:5)
    at retrofit2.l.execute(OkHttpCall.java:8)
    at retrofit2.adapter.rxjava2.c.H5(CallExecuteObservable.java:5)
    at io.reactivex.z.f(Observable.java:4)
    at retrofit2.adapter.rxjava2.a.H5(Unknown Source:7)
    at io.reactivex.z.f(Observable.java:4)
    at io.reactivex.internal.operators.observable.ObservableSubscribeOn$a.run(Unknown Source:6)
    at io.reactivex.h0$a.run(Scheduler.java:2)
    at io.reactivex.internal.schedulers.ScheduledRunnable.run(ScheduledRunnable.java:2)
    at io.reactivex.internal.schedulers.ScheduledRunnable.call(Unknown Source:0)
    at java.util.concurrent.FutureTask.run(FutureTask.java:266)
    at java.util.concurrent.ScheduledThreadPoolExecutor$ScheduledFutureTask.run(ScheduledThreadPoolExecutor.java:301)
    at java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1167)
    at java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:641)
    at java.lang.Thread.run(Thread.java:920)

/account/login/
jalxpCVnrJIcUaXpu8Awn8I5UYgfFifF

[Hook] String.getBytes() 被调用
  字符串内容: jalxpCVnrJIcUaXpu8Awn8I5UYgfFifF
  调用栈:
java.lang.Exception
    at java.lang.String.getBytes(Native Method)
    at com.max.security.SecurityTool.setKB(Native Method)
    at com.max.xiaoheihe.router.serviceimpl.i.b(RequestInterceptImpl.java:12)
    at com.max.hbcommon.network.b.h(ApiModule.java:13)
    at com.max.hbcommon.network.b$a.intercept(Unknown Source:35)
    at okhttp3.internal.http.RealInterceptorChain.proceed(RealInterceptorChain.kt:12)
    at okhttp3.internal.connection.RealCall.getResponseWithInterceptorChain$okhttp(RealCall.kt:16)
    at okhttp3.internal.connection.RealCall.execute(RealCall.kt:5)
    at retrofit2.l.execute(OkHttpCall.java:8)
    at retrofit2.adapter.rxjava2.c.H5(CallExecuteObservable.java:5)
    at io.reactivex.z.f(Observable.java:4)
    at retrofit2.adapter.rxjava2.a.H5(Unknown Source:7)
    at io.reactivex.z.f(Observable.java:4)
    at io.reactivex.internal.operators.observable.ObservableSubscribeOn$a.run(Unknown Source:6)
    at io.reactivex.h0$a.run(Scheduler.java:2)
    at io.reactivex.internal.schedulers.ScheduledRunnable.run(ScheduledRunnable.java:2)
    at io.reactivex.internal.schedulers.ScheduledRunnable.call(Unknown Source:0)
    at java.util.concurrent.FutureTask.run(FutureTask.java:266)
    at java.util.concurrent.ScheduledThreadPoolExecutor$ScheduledFutureTask.run(ScheduledThreadPoolExecutor.java:301)
    at java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1167)
    at java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:641)
    at java.lang.Thread.run(Thread.java:920)

1759752514
jalxpCVnrJIcUaXpu8Awn8I5UYgfFifF

[Hook] String.getBytes() 被调用
  字符串内容: jalxpCVnrJIcUaXpu8Awn8I5UYgfFifF
  调用栈:
java.lang.Exception
    at java.lang.String.getBytes(Native Method)
    at com.max.security.SecurityTool.setKM(Native Method)
    at com.max.xiaoheihe.router.serviceimpl.i.b(RequestInterceptImpl.java:13)
    at com.max.hbcommon.network.b.h(ApiModule.java:13)
    at com.max.hbcommon.network.b$a.intercept(Unknown Source:35)
    at okhttp3.internal.http.RealInterceptorChain.proceed(RealInterceptorChain.kt:12)
    at okhttp3.internal.connection.RealCall.getResponseWithInterceptorChain$okhttp(RealCall.kt:16)
    at okhttp3.internal.connection.RealCall.execute(RealCall.kt:5)
    at retrofit2.l.execute(OkHttpCall.java:8)
    at retrofit2.adapter.rxjava2.c.H5(CallExecuteObservable.java:5)
    at io.reactivex.z.f(Observable.java:4)
    at retrofit2.adapter.rxjava2.a.H5(Unknown Source:7)
    at io.reactivex.z.f(Observable.java:4)
    at io.reactivex.internal.operators.observable.ObservableSubscribeOn$a.run(Unknown Source:6)
    at io.reactivex.h0$a.run(Scheduler.java:2)
    at io.reactivex.internal.schedulers.ScheduledRunnable.run(ScheduledRunnable.java:2)
    at io.reactivex.internal.schedulers.ScheduledRunnable.call(Unknown Source:0)
    at java.util.concurrent.FutureTask.run(FutureTask.java:266)
    at java.util.concurrent.ScheduledThreadPoolExecutor$ScheduledFutureTask.run(ScheduledThreadPoolExecutor.java:301)
    at java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1167)
    at java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:641)
    at java.lang.Thread.run(Thread.java:920)

jalxpCVnrJIcUaXpu8Awn8I5UYgfFifF

[Hook] String.getBytes() 被调用
  字符串内容: jalxpCVnrJIcUaXpu8Awn8I5UYgfFifF
  调用栈:
java.lang.Exception
    at java.lang.String.getBytes(Native Method)
    at com.max.security.SecurityTool.getVA(Native Method)
    at com.max.xiaoheihe.router.serviceimpl.i.b(RequestInterceptImpl.java:17)
    at com.max.hbcommon.network.b.h(ApiModule.java:13)
    at com.max.hbcommon.network.b$a.intercept(Unknown Source:35)
    at okhttp3.internal.http.RealInterceptorChain.proceed(RealInterceptorChain.kt:12)
    at okhttp3.internal.connection.RealCall.getResponseWithInterceptorChain$okhttp(RealCall.kt:16)
    at okhttp3.internal.connection.RealCall.execute(RealCall.kt:5)
    at retrofit2.l.execute(OkHttpCall.java:8)
    at retrofit2.adapter.rxjava2.c.H5(CallExecuteObservable.java:5)
    at io.reactivex.z.f(Observable.java:4)
    at retrofit2.adapter.rxjava2.a.H5(Unknown Source:7)
    at io.reactivex.z.f(Observable.java:4)
    at io.reactivex.internal.operators.observable.ObservableSubscribeOn$a.run(Unknown Source:6)
    at io.reactivex.h0$a.run(Scheduler.java:2)
    at io.reactivex.internal.schedulers.ScheduledRunnable.run(ScheduledRunnable.java:2)
    at io.reactivex.internal.schedulers.ScheduledRunnable.call(Unknown Source:0)
    at java.util.concurrent.FutureTask.run(FutureTask.java:266)
    at java.util.concurrent.ScheduledThreadPoolExecutor$ScheduledFutureTask.run(ScheduledThreadPoolExecutor.java:301)
    at java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1167)
    at java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:641)
    at java.lang.Thread.run(Thread.java:920)

com.max.xiaoheihe

```

因为日志比较多，我们简单优化一下代码，发现 noce 是 32 位的字符串，我们将字符串的长度做一个限制，再来打印堆栈

```
function sting_put() {
  Java.perform(function () {
    // 获取String类
    var StringClass = Java.use('java.lang.String');
    // 1.  Hook 带字符集名称的 getBytes(String charsetName) 方法（入参为字符集名称）
    StringClass.getBytes.overload('java.lang.String').implementation = function () {
      let str = this.toString();
      console.log(str)
      if (str.length == 32) {
        console.log('\n[Hook] String.getBytes() 被调用');
        console.log('  字符串内容: ' + str); // 打印当前字符串
        console.log('  调用栈:');
        console.log(Java.use('android.util.Log').getStackTraceString(Java.use('java.lang.Exception').$new())); // 打印调用栈
        return this.getBytes();
      }
      return this.getBytes();
    };

  });
}

```

这样我们可以精准定位出生成位置 com.max.xiaoheihe.router.serviceimpl.i.b，再往下走就开始调用 native 方法了，我们从这里入手去看看

![](https://mmbiz.qpic.cn/mmbiz_png/fj9hsKCs4SHkHedTh5nuPQbkbZZ59AojCCdqe5n246cV1Px1r1GjgSPmEPnCCAEyu5OwN91u6pwmribDxD7h1BQ/640?wx_fmt=png&from=appmsg&watermark=1#imgIndex=12)

从打印堆栈可以定位到这里，下一层的函数是 getVD 和 getVX，我们先写一个 hook 代码和抓包的信息联合一起分析，看看是否是这个位置

```
function hook_native_method() {
  Java.perform(function () {
    let SecurityTool = Java.use("com.max.security.SecurityTool");
    SecurityTool["getVD"].implementation = function (context, str) {
      console.log(`SecurityTool.getVD is called: context=${context}, str=${str}`);
      let result = this["getVD"](context, str);
      console.log(`SecurityTool.getVD result=${result}`);
      return result;
    };
  })
}

```

因为外层是一个 getVD 的函数，先 hook 外层看看情况

![](https://mmbiz.qpic.cn/mmbiz_png/fj9hsKCs4SHkHedTh5nuPQbkbZZ59AojiagWfgM31dUOC9B14ls4fMia7T6ELfUaVEEKaalo6HYWXXg384UfRaMQ/640?wx_fmt=png&from=appmsg&watermark=1#imgIndex=13)

没问题，就是我们需要的参数

我们继续对这个函数调用进行一个分析

```
String vd2 = SecurityTool.getVD(HeyBoxApplication.C(), SecurityTool.getVX(HeyBoxApplication.C(), "HPPDCEAENEHBFHPASRDCAMNHJLAAPF"));
HeyBoxApplication.C(), SecurityTool.getVX(HeyBoxApplication.C(), "HPPDCEAENEHBFHPASRDCAMNHJLAAPF")
SecurityTool.getVX(HeyBoxApplication.C(), "HPPDCEAENEHBFHPASRDCAMNHJLAAPF")

```

两个参数，一个是 HeyBoxApplication.C()，一个是 SecurityTool.getVX(HeyBoxApplication.C(), "HPPDCEAENEHBFHPASRDCAMNHJLAAPF") 的一个函数调用

```
SecurityTool.getVD is called: context=com.max.xiaoheihe.app.HeyBoxApplication@c790643, str=O2eqUFZC94Ix3NCBI6lc77lsPh1qWayE
SecurityTool.getVD result=NqY5fY1BmjOy4AjzT90Of3wcJA1KMyCw

```

从日志可以看出第一个参数是一个设备的上下文信息，第二个参数是 gerVX 函数生成的 32 位字符串

![](https://mmbiz.qpic.cn/mmbiz_png/fj9hsKCs4SHkHedTh5nuPQbkbZZ59AojeVic6M85Xiadq68phmOe2ZwPw7wY8ZPus2QIXlrfNm23JjuDVtoPgzrA/640?wx_fmt=png&from=appmsg&watermark=1#imgIndex=14)

跟进去就可以看到一堆 so 层的 native 方法，我们找一下 so 文件的加载，然后去分析 so 层的逻辑

![](https://mmbiz.qpic.cn/mmbiz_png/fj9hsKCs4SHkHedTh5nuPQbkbZZ59AojibarQicDHALPyGLgQEGg8VZLq4XkaZEHJvEdWJibDEtVe5ZicaxZ4X9xtQ/640?wx_fmt=png&from=appmsg&watermark=1#imgIndex=15)

找到了，开干

四、so 层分析
========

1、getVX
-------

在文件里定位到 so 文件，拖进 ida 进行分析

![](https://mmbiz.qpic.cn/mmbiz_png/fj9hsKCs4SHkHedTh5nuPQbkbZZ59AojZ5TWt5c5GgrZalJ4fjjRPDhiaDvZEh1Z5GfA5TJN6QicAx5gDnEaMxMQ/640?wx_fmt=png&from=appmsg&watermark=1#imgIndex=16)

现在导出函数表搜索 java，发现不是静态注册函数，我们 hook 一下 RegisterNatives 函数，找到动态注册函数的偏移

```
function hook_RegisterNatives() {
  var addrRegisterNatives = null;
  var symbols = Module.enumerateSymbolsSync("libart.so");
  for (var i = 0; i < symbols.length; i++) {
    var symbol = symbols[i];
    if (symbol.name.indexOf("art") >= 0 &&
        symbol.name.indexOf("JNI") >= 0 &&
        symbol.name.indexOf("RegisterNatives") >= 0 &&
        symbol.name.indexOf("CheckJNI") < 0) {
      addrRegisterNatives = symbol.address;
      console.log("RegisterNatives is at ", symbol.address, symbol.name);
      break
    }
  }
  if (addrRegisterNatives) {
    Interceptor.attach(addrRegisterNatives, {
      onEnter: function (args) {
        console.log('注册函数定位===>')
        var env = args[0];        
        var java_class = args[1]; 
        var class_name = Java.vm.tryGetEnv().getClassName(java_class);
        var taget_class = "com.max.security.SecurityTool";   
        if (class_name === taget_class) {
          console.log("\n[RegisterNatives] method_count:", args[3]);
          var methods_ptr = ptr(args[2]);
          var method_count = parseInt(args[3]);
          for (var i = 0; i < method_count; i++) {
            var name_ptr = Memory.readPointer(methods_ptr.add(i * Process.pointerSize * 3));
            var sig_ptr = Memory.readPointer(methods_ptr.add(i * Process.pointerSize * 3 + Process.pointerSize));
            var fnPtr_ptr = Memory.readPointer(methods_ptr.add(i * Process.pointerSize * 3 + Process.pointerSize * 2));
            var name = Memory.readCString(name_ptr);
            var sig = Memory.readCString(sig_ptr);
            var find_module = Process.findModuleByAddress(fnPtr_ptr);
            var offset = ptr(fnPtr_ptr).sub(find_module.base);
            console.log("name:", class_name + " " + name, "sig:", sig, 'module_name:', find_module.name, "offset:", offset, Process.pointerSize);
          }
        }
      }
    });
  }

}

```

需要注意的是这里注入的时间，需要跟着 frida 检测处理的同时注入，这才是 so 函数加载的时机

```
setKA sig: (Ljava/lang/String;)V module_name: libhbsecurity.so offset: 0xa35c0 8
setKB sig: (Ljava/lang/String;Ljava/lang/String;)V module_name: libhbsecurity.so offset: 0xa3c34 8
setKM sig: (Ljava/lang/String;Ljava/lang/String;)V module_name: libhbsecurity.so offset: 0xa3d80 8
setKT sig: (Ljava/lang/String;Ljava/lang/String;)V module_name: libhbsecurity.so offset: 0xa3ecc 8
setKN sig: (Ljava/lang/String;Ljava/lang/String;)V module_name: libhbsecurity.so offset: 0xa3fd8 8
setKD sig: (Ljava/lang/String;Ljava/lang/String;)V module_name: libhbsecurity.so offset: 0xa40e0 8
setKC sig: (Ljava/lang/String;Ljava/lang/String;)V module_name: libhbsecurity.so offset: 0xa42d8 8
getVX sig: (Landroid/content/Context;Ljava/lang/String;)Ljava/lang/String; module_name: libhbsecurity.so offset: 0xa45d0 8
getVA sig: (Landroid/content/Context;Ljava/lang/String;)Ljava/lang/String; module_name: libhbsecurity.so offset: 0xa4834 8
getVB sig: (I)I module_name: libhbsecurity.so offset: 0xa5954 8
getVC sig: (Landroid/content/Context;Ljava/lang/String;)Ljava/lang/String; module_name: libhbsecurity.so offset: 0xa5a58 8
getVD sig: (Landroid/content/Context;Ljava/lang/String;)Ljava/lang/String; module_name: libhbsecurity.so offset: 0xa5e44 8
resetVA sig: ()V module_name: libhbsecurity.so offset: 0xa6428 8

```

根据 getVX 函数偏移 0xa45d0，在 ida 中利用快捷键 G 定位

![](https://mmbiz.qpic.cn/mmbiz_png/fj9hsKCs4SHkHedTh5nuPQbkbZZ59AojcEiaI7VGeysyG6F3sKhQe8zcB75h6MrXPfhKI4VFejhFpak4NgIDC2w/640?wx_fmt=png&from=appmsg&watermark=1#imgIndex=17)

修改 ida 中函数和入参的名称方便再定位修改

![](https://mmbiz.qpic.cn/mmbiz_png/fj9hsKCs4SHkHedTh5nuPQbkbZZ59AojzGHFpH9pg7nibdReIkFTkzTEwdZlHReQdAHrbYP66A8LGic2lHTW8ialw/640?wx_fmt=png&from=appmsg&watermark=1#imgIndex=18)

这里的话只有 sub_A2B50 对入参 str 进行了一个处理，hook 一下看看情况

```
function print_arg(addr) {
    var module = Process.findRangeByAddress(addr);
    if (module != null) return hexdump(addr) + "\n";
    return ptr(addr) + "\n";
}
function hook_native_addr1(funcPtr, paramsNum) {
  var module = Process.findModuleByAddress(funcPtr);
  Interceptor.attach(funcPtr, {
    onEnter: function (args) {
      this.logs = [];
      this.params = [];
      this.logs.push("call " + module.name + "!" + ptr(funcPtr).sub(module.base) + "\n");
      for (let i = 0; i < paramsNum; i++) {
        this.params.push(args[i]);
        this.logs.push("this.args" + i + " onEnter: " + print_arg(args[i]));
      }
      // console.log(args[0].readInt())
    }, onLeave: function (retval) {
      for (let i = 0; i < paramsNum; i++) {
        this.logs.push("this.args" + i + " onLeave: " + print_arg(this.params[i]));
      }
      this.logs.push("retval onLeave: " + print_arg(retval) + "\n");
      console.log(this.logs);
      console.log("==================")
      console.log(retval)
    }
  });
}

function hook_so_native_method() {
  var soAddr = Module.findBaseAddress("libhbsecurity.so");
  // sub_A2B50
  var funcAddr = soAddr.add(0xA2B50);
  hook_native_addr(funcAddr, 3);
}
//728A4

```

📎xhhrz.log

从日志内容可以看出，没有明显的加密字符串返回，说明这里不是一个加密逻辑的点。然后 v6 对 v5 处理后的结果，看着像是地址的偏移，也可以是来 hook 一下

```
function print_arg(addr) {
  var module = Process.findRangeByAddress(addr);
  if (module != null) return hexdump(addr) + "\n";
  return ptr(addr) + "\n";
}
function hook_native_addr1(funcPtr, paramsNum) {
  var module = Process.findModuleByAddress(funcPtr);
  Interceptor.attach(funcPtr, {
    onEnter: function (args) {
      this.logs = [];
      this.params = [];
      this.logs.push("call " + module.name + "!" + ptr(funcPtr).sub(module.base) + "\n");
      for (let i = 0; i < paramsNum; i++) {
        this.params.push(args[i]);
        this.logs.push("this.args" + i + " onEnter: " + print_arg(args[i]));
      }
      // console.log(args[0].readInt())
    }, onLeave: function (retval) {
      for (let i = 0; i < paramsNum; i++) {
        this.logs.push("this.args" + i + " onLeave: " + print_arg(this.params[i]));
      }
      this.logs.push("retval onLeave: " + print_arg(retval) + "\n");
      console.log(this.logs);
      console.log("==================")
      console.log(retval)
    }
  });
}

function hook_so_native_method() {
  var soAddr = Module.findBaseAddress("libhbsecurity.so");
  var funcAddr = soAddr.add(0x728A4);
  hook_native_addr(funcAddr,1);
}


```

📎xhhrz.log

都是一些空值，可能是指针的一些信息，不能直接用 hexdump 打印出来，我们接下来看的 v6 又进行了哪些处理

![](https://mmbiz.qpic.cn/mmbiz_png/fj9hsKCs4SHkHedTh5nuPQbkbZZ59AojqlawbendiazQO2R7VSI8DgxGIo5cIeb3alSic0OBSt8BOiahVClFs0kuA/640?wx_fmt=png&from=appmsg&watermark=1#imgIndex=19)

v8 是由 v6 生成的，我们直接 hook 看看

![](https://mmbiz.qpic.cn/mmbiz_png/fj9hsKCs4SHkHedTh5nuPQbkbZZ59AojspDncXbtVdCQKvoMOIqPPPStAHUkM2tWZQARTncFoviaUkT2icvlv3TA/640?wx_fmt=png&from=appmsg&watermark=1#imgIndex=20)

这里就会发现很像我们最后生成的结果，我们跟进去看看怎么去使用的 v6

```
__int64 sub_A6620()
{
    __int64 v0; // x19
    unsigned __int8 v1; // w8
    __int64 result; // x0

    v0 = sub_72AE4(0x21);
    *(_BYTE *)v0 = byte_230F4[(unsigned int)sub_4AC1C(0x3Eu)];
    *(_BYTE *)(v0 + 1) = byte_230F4[(unsigned int)sub_4AC1C(0x3Eu)];
    *(_BYTE *)(v0 + 2) = byte_230F4[(unsigned int)sub_4AC1C(0x3Eu)];
    *(_BYTE *)(v0 + 3) = byte_230F4[(unsigned int)sub_4AC1C(0x3Eu)];
    *(_BYTE *)(v0 + 4) = byte_230F4[(unsigned int)sub_4AC1C(0x3Eu)];
    *(_BYTE *)(v0 + 5) = byte_230F4[(unsigned int)sub_4AC1C(0x3Eu)];
    *(_BYTE *)(v0 + 6) = byte_230F4[(unsigned int)sub_4AC1C(0x3Eu)];
    *(_BYTE *)(v0 + 7) = byte_230F4[(unsigned int)sub_4AC1C(0x3Eu)];
    *(_BYTE *)(v0 + 8) = byte_230F4[(unsigned int)sub_4AC1C(0x3Eu)];
    *(_BYTE *)(v0 + 9) = byte_230F4[(unsigned int)sub_4AC1C(0x3Eu)];
    *(_BYTE *)(v0 + 10) = byte_230F4[(unsigned int)sub_4AC1C(0x3Eu)];
    *(_BYTE *)(v0 + 11) = byte_230F4[(unsigned int)sub_4AC1C(0x3Eu)];
    *(_BYTE *)(v0 + 12) = byte_230F4[(unsigned int)sub_4AC1C(0x3Eu)];
    *(_BYTE *)(v0 + 13) = byte_230F4[(unsigned int)sub_4AC1C(0x3Eu)];
    *(_BYTE *)(v0 + 14) = byte_230F4[(unsigned int)sub_4AC1C(0x3Eu)];
    *(_BYTE *)(v0 + 15) = byte_230F4[(unsigned int)sub_4AC1C(0x3Eu)];
    *(_BYTE *)(v0 + 16) = byte_230F4[(unsigned int)sub_4AC1C(0x3Eu)];
    *(_BYTE *)(v0 + 17) = byte_230F4[(unsigned int)sub_4AC1C(0x3Eu)];
    *(_BYTE *)(v0 + 18) = byte_230F4[(unsigned int)sub_4AC1C(0x3Eu)];
    *(_BYTE *)(v0 + 19) = byte_230F4[(unsigned int)sub_4AC1C(0x3Eu)];
    *(_BYTE *)(v0 + 20) = byte_230F4[(unsigned int)sub_4AC1C(0x3Eu)];
    *(_BYTE *)(v0 + 21) = byte_230F4[(unsigned int)sub_4AC1C(0x3Eu)];
    *(_BYTE *)(v0 + 22) = byte_230F4[(unsigned int)sub_4AC1C(0x3Eu)];
    *(_BYTE *)(v0 + 23) = byte_230F4[(unsigned int)sub_4AC1C(0x3Eu)];
    *(_BYTE *)(v0 + 24) = byte_230F4[(unsigned int)sub_4AC1C(0x3Eu)];
    *(_BYTE *)(v0 + 25) = byte_230F4[(unsigned int)sub_4AC1C(0x3Eu)];
    *(_BYTE *)(v0 + 26) = byte_230F4[(unsigned int)sub_4AC1C(0x3Eu)];
    *(_BYTE *)(v0 + 27) = byte_230F4[(unsigned int)sub_4AC1C(0x3Eu)];
    *(_BYTE *)(v0 + 28) = byte_230F4[(unsigned int)sub_4AC1C(0x3Eu)];
    *(_BYTE *)(v0 + 29) = byte_230F4[(unsigned int)sub_4AC1C(0x3Eu)];
    *(_BYTE *)(v0 + 30) = byte_230F4[(unsigned int)sub_4AC1C(0x3Eu)];
    v1 = byte_230F4[(unsigned int)sub_4AC1C(0x3Eu)];
    result = v0;
    *(_WORD *)(v0 + 31) = v1;
    return result;
}

```

可以看到 sub_4AC1C 不断去处理 0x3Eu 来填充 v0 的字段长度，我们去 hook sub_4AC1C 处理情况

📎xhhrz.log

我们这里发现他不停的去调用生成新的数字

![](https://mmbiz.qpic.cn/mmbiz_png/fj9hsKCs4SHkHedTh5nuPQbkbZZ59AojMOicKlXhDfgzhZlsSjDV1uQCS6dblAuheJzf5jTueXJg5GDh7jJMQdA/640?wx_fmt=png&from=appmsg&watermark=1#imgIndex=21)

byte_230F4 可能是一个数组，用来存储数据映射后面产生的随机数，填充生成我们的加密字符串，我们需要根据汇编代码去找 byte_230F4 的值

![](https://mmbiz.qpic.cn/mmbiz_png/fj9hsKCs4SHkHedTh5nuPQbkbZZ59AojDETparLOtmfeOZibo2E6xrtVI2oqxVB0tNic8nW4gaiab0WPEVtIxyowA/640?wx_fmt=png&from=appmsg&watermark=1#imgIndex=22)

ARM64 的`LDRB`指令支持多种寻址方式，最常见的格式为：

```
LDRB <Xd>, [<Xn|SP>, <offset>]

```

*   `**<Xd>**`：目标寄存器（64 位通用寄存器，如`X0-X30`），用于存储加载的字节数据（零扩展后）。
*   `**<Xn|SP>**`：基址寄存器（64 位通用寄存器`X0-X30`或栈指针`SP`），存储内存访问的基地址。
*   `**<offset>**`：偏移量，用于计算最终内存地址（基地址 + 偏移量）。偏移量可以是：

*   立即数（如`[#0x10](javascript:;)`，范围通常为 ±4095）；
*   寄存器偏移（如`Xm`，表示基地址 + `Xm`的值）。

![](https://mmbiz.qpic.cn/mmbiz_png/fj9hsKCs4SHkHedTh5nuPQbkbZZ59AojdfFemQvnrOicLvgiaT18nm0PeFLYHVyXh1BbjZzOnJOYu7W7cFtBxr0g/640?wx_fmt=png&from=appmsg&watermark=1#imgIndex=23)

这里的话我们是将 x20 中下标为 w0 的值赋值给 w8，也就是说，我们去找 x20 的值就可以知道他的映射关系

```
function hook_so_x(funcPtr) {
  var module = Process.findModuleByAddress(funcPtr);
  Interceptor.attach(funcPtr, {
    onEnter: function (args) {
      console.log('enter')
      console.log('x20值--->', hexdump(this.context.x20));
    },
    onLeave: function (retval) {
    }
  })
}
function hook_arm_method() {
  var soAddr = Module.findBaseAddress("libhbsecurity.so");
  var funcAddr = soAddr.add(0xA6668);
  hook_so_x(funcAddr)
}

```

![](https://mmbiz.qpic.cn/mmbiz_png/fj9hsKCs4SHkHedTh5nuPQbkbZZ59AojtbkJNeiau80PLOPyeG3VN3IkzsYbibYqjFt15xM7XQAXMFLXGda3amLw/640?wx_fmt=png&from=appmsg&watermark=1#imgIndex=24)

📎xhhrz.log

这样可以分析出算法的大概逻辑，我们在具体看看 sub_4AC1C 函数

```
__int64 sub_4AC1C(unsigned int a1)
{
  v2 = sub_4AB84();  // 初始化并获取初始值
  // 尝试使用函数表中的函数
  v3 = *(qword_BDEB8 + 24);  // 获取偏移24处的函数指针
  if (v3)
    return v3(a1);  // 如果存在，直接调用

  // 备用实现：生成随机数并取模
  if (a1 < 2)
    return 0;  // 边界情况处理
  do {
    v5 = sub_4AB84();  // 获取随机值
    v2 = *(qword_BDEB8 + 8)(v5);  // 调用偏移8处的函数处理随机值
  } while ((unsigned int)v2 < (-a1 % a1));  // 避免模偏差

  return (unsigned int)v2 % a1;  // 返回范围内的随机数
}

```

```
// 这是一个初始化函数，返回函数指针
__int64 (*sub_4AB84())(void)
{
    if (!qword_BDEB8) {  // 检查全局变量是否已初始化
        qword_BDEB8 = (__int64)off_AEB60;  // 初始化全局指针
        sub_4AB84();  // 递归调用自身
        result = *(__int64 (**)(void))(qword_BDEB8 + 16);  // 获取函数指针
        if (result)
            return result();  // 调用并返回结果
    }
    return result;
}

```

接着算法的一个分析，我们打印 sub_4AC1C 函数返回的一个结果，得到如图的一个日志

![](https://mmbiz.qpic.cn/mmbiz_png/fj9hsKCs4SHkHedTh5nuPQbkbZZ59AojxHJf22yiaHyVjAATqjIgfJv4qL1TicqKJfeOwU4fiaIG7ZsaC1VYAvAicQ/640?wx_fmt=png&from=appmsg&watermark=1#imgIndex=25)

知道存在着映射关系，就要针对映射表和函数最后返回值来找映射关系

以值 OKnQWyZw7DKz1RqDapbJJ6e9MOfMeYlE 为例

![](https://mmbiz.qpic.cn/mmbiz_png/fj9hsKCs4SHkHedTh5nuPQbkbZZ59AojY4OZicmgHhD9Fu64QJ1ENDMXu9eJJ6vhRfjahj7tyrIwWs2yFfZoumQ/640?wx_fmt=png&from=appmsg&watermark=1#imgIndex=26)

这是 dump 出来的映射表的值，日志是返回值

📎xhhtt.log

我们需要根据最后的结果，和日志返回值的进行对照，以及和映射表的值，找出规律。首先我们观察可以发现整体包含三部分，小写字母，大写字母，数字 0-9，我们有两点需要去判断

（1）各个类型之间的映射关系是否是连续的

（2）各个类型之前与映射表的关系，明显存在的偏移关系

![](https://mmbiz.qpic.cn/mmbiz_png/fj9hsKCs4SHkHedTh5nuPQbkbZZ59AojibgWrVsl5eYXe7bvmjibmBBnIiczciaQyXrkYqjicAXovic3jNVR8X9ia83wQ/640?wx_fmt=png&from=appmsg&watermark=1#imgIndex=27)

OKnQWyZw7DKz1RqDapbJJ6e9MOfMeYlE 为例

从这个两点的分析，我们可以去找我们目标字符串中有明显特征的偏移变化，如：

数字：1，9

小写字母：y，z

大写字母：Y,Z

这里不带着不推了，就是找规律，然后加减法的运算，给出一个结论

 大写字母：偏移 0x1D

 小写字母：偏移 0x57

  数字：偏移 0x30

```
const CUSTOM_RANGES = {
  number: {min: 0x0, max: 0x9, startChar: '0'},       // 数字1-9范围
  lowercase: {min: 0x0A, max: 0x23, startChar: 'a'},  // 小写字母a-z范围
  uppercase: {min: 0x24, max: 0x3d, startChar: 'A'}   // 大写字母A-Z范围
};

function offset_Char(hexValue) {
  // 统一转换为数字类型
  const hexNum = typeof hexValue === 'string'
    ? parseInt(hexValue, 16)
    : hexValue;

  // 检查是否在数字范围（1-9）
  if (hexNum >= CUSTOM_RANGES.number.min && hexNum <= CUSTOM_RANGES.number.max) {
    const offset = hexNum - CUSTOM_RANGES.number.min;
    return String.fromCharCode(CUSTOM_RANGES.number.startChar.charCodeAt(0) + offset);
  }

  // 检查是否在小写字母范围（a-z）
  if (hexNum >= CUSTOM_RANGES.lowercase.min && hexNum <= CUSTOM_RANGES.lowercase.max) {
    const offset = hexNum - CUSTOM_RANGES.lowercase.min;
    return String.fromCharCode(CUSTOM_RANGES.lowercase.startChar.charCodeAt(0) + offset);
  }

  // 检查是否在大写字母范围（A-Z）
  if (hexNum >= CUSTOM_RANGES.uppercase.min && hexNum <= CUSTOM_RANGES.uppercase.max) {
    const offset = hexNum - CUSTOM_RANGES.uppercase.min;
    return String.fromCharCode(CUSTOM_RANGES.uppercase.startChar.charCodeAt(0) + offset);
  }

  return null;
}

```

这样打印出日志，就可以校验是否是符合映射表关系

📎xhhtt1.log

2、getVd
-------

```
setKA sig: (Ljava/lang/String;)V module_name: libhbsecurity.so offset: 0xa35c0 8
setKB sig: (Ljava/lang/String;Ljava/lang/String;)V module_name: libhbsecurity.so offset: 0xa3c34 8
setKM sig: (Ljava/lang/String;Ljava/lang/String;)V module_name: libhbsecurity.so offset: 0xa3d80 8
setKT sig: (Ljava/lang/String;Ljava/lang/String;)V module_name: libhbsecurity.so offset: 0xa3ecc 8
setKN sig: (Ljava/lang/String;Ljava/lang/String;)V module_name: libhbsecurity.so offset: 0xa3fd8 8
setKD sig: (Ljava/lang/String;Ljava/lang/String;)V module_name: libhbsecurity.so offset: 0xa40e0 8
setKC sig: (Ljava/lang/String;Ljava/lang/String;)V module_name: libhbsecurity.so offset: 0xa42d8 8
getVX sig: (Landroid/content/Context;Ljava/lang/String;)Ljava/lang/String; module_name: libhbsecurity.so offset: 0xa45d0 8
getVA sig: (Landroid/content/Context;Ljava/lang/String;)Ljava/lang/String; module_name: libhbsecurity.so offset: 0xa4834 8
getVB sig: (I)I module_name: libhbsecurity.so offset: 0xa5954 8
getVC sig: (Landroid/content/Context;Ljava/lang/String;)Ljava/lang/String; module_name: libhbsecurity.so offset: 0xa5a58 8
getVD sig: (Landroid/content/Context;Ljava/lang/String;)Ljava/lang/String; module_name: libhbsecurity.so offset: 0xa5e44 8
resetVA sig: ()V module_name: libhbsecurity.so offset: 0xa6428 8

```

在前面部分内容也已经得到了 getVD 的一个偏移 0xa5e44

![](https://mmbiz.qpic.cn/mmbiz_png/fj9hsKCs4SHkHedTh5nuPQbkbZZ59AojTWx74ia75Cp0iciaickjwIf19ezFKTZovuYKF1QlfoSqKGAU8icDwGGSDPg/640?wx_fmt=png&from=appmsg&watermark=1#imgIndex=28)

还是老规矩，直接来

![](https://mmbiz.qpic.cn/mmbiz_png/fj9hsKCs4SHkHedTh5nuPQbkbZZ59AojmRPrKqnkVnCJgfjZaYqAh3qziaSGE4MMKzf4LutqSS1N7xs50e39vDw/640?wx_fmt=png&from=appmsg&watermark=1#imgIndex=29)

有控制流，属实不会分析，直接练手一下 trace，高级的 trace 不会用，学习大佬文章了解的这个，先用这个练手学习

项目地址：https://github.com/bmax121/sktrace

参考文章：https://bbs.kanxue.com/thread-264680.htm

指令：python sktrace.py -m attach -l libhbsecurity.so -i 0xA5E44 小黑盒 > xhh1.log

点击登陆调用一下

![](https://mmbiz.qpic.cn/mmbiz_png/fj9hsKCs4SHkHedTh5nuPQbkbZZ59Aojbru1ibZYmliaBCHMVVzByzYq6ibcbibfGuUkRYE7h5sc6ETJ743aVazeJA/640?wx_fmt=png&from=appmsg#imgIndex=30)

![](https://mmbiz.qpic.cn/mmbiz_png/fj9hsKCs4SHkHedTh5nuPQbkbZZ59AojAqiax8d5Wfs9OUCibBhu7yYO7X6x5zxia5q4QgjgCvF6NKOMMFDZtr0Kg/640?wx_fmt=png&from=appmsg&watermark=1#imgIndex=31)

这样就是完成一次成功的 trace，我们要去找最终结果字符串 svXkmJPQ1hzZ2nxOKL74zSk3SrG8FIoS 生成位置

![](https://mmbiz.qpic.cn/mmbiz_png/fj9hsKCs4SHkHedTh5nuPQbkbZZ59Aoj6VLjlUgWfJGxeyGztN6pcLt0pdyYdtdHgfcviazDsIhEmIPRuGhH8tw/640?wx_fmt=png&from=appmsg&watermark=1#imgIndex=32)

![](https://mmbiz.qpic.cn/mmbiz_png/fj9hsKCs4SHkHedTh5nuPQbkbZZ59AojOptKvjTqtpEc15BRA59y2JATQ2dQVqRJUsxZjj3SmFjjGib9K44GxIw/640?wx_fmt=png&from=appmsg&watermark=1#imgIndex=33)![](https://mmbiz.qpic.cn/mmbiz_png/fj9hsKCs4SHkHedTh5nuPQbkbZZ59AojSYtLmCzJoyoKUkCvmaiczibbECSZ99zyTDyOiaMwrx775WmLia2icDmCh8w/640?wx_fmt=png&from=appmsg&watermark=1#imgIndex=34)

这样就找到了第一组数组，确定是在这个函数内生成的。我们去看看他的一个生成位置，也就是 0x73 以及后续一堆字符串的生成，我们直接搜索定位，留下标记

![](https://mmbiz.qpic.cn/mmbiz_png/fj9hsKCs4SHkHedTh5nuPQbkbZZ59AojmVbqrkV94e2mYO4nRhPprmEEyq4h7qa44ElvTmPeUArEvWZPuXatFw/640?wx_fmt=png&from=appmsg&watermark=1#imgIndex=35)

这里有两个，很明显在上面那里留下标记，依次这样找一下

![](https://mmbiz.qpic.cn/mmbiz_png/fj9hsKCs4SHkHedTh5nuPQbkbZZ59AojWDKDTBx728qITd475wsCbQyD8SFt1nHY58b0ibiboA5t2v0JjTPMCtSA/640?wx_fmt=png&from=appmsg&watermark=1#imgIndex=36)

这样下来我们可以发现一个特征

`ldrb  w8, [x20, w0, uxtw]`

都是在这样的一个汇编代码里面，非常眼熟，我们的 getVX 里的汇编是一样的，我们计算一下偏移，去 ida 里面看看第一个的生成位置

![](https://mmbiz.qpic.cn/mmbiz_png/fj9hsKCs4SHkHedTh5nuPQbkbZZ59Aoj4Qibk7eaIPV3GTLOOJMhA26adCrDI36s9VVia6Y55rTvv0icz4yj0mmpA/640?wx_fmt=png&from=appmsg&watermark=1#imgIndex=37)

有点意思，虚晃一枪，最后还是这个随机数生成的

![](https://mmbiz.qpic.cn/mmbiz_png/fj9hsKCs4SHkHedTh5nuPQbkbZZ59AojyAqLdicUYlzNoGj1djkic6mFTW3Kia2LAEF5FoQB6UspibOFyXPm4NYAYQ/640?wx_fmt=png&from=appmsg&watermark=1#imgIndex=38)

![](https://mmbiz.qpic.cn/mmbiz_png/fj9hsKCs4SHkHedTh5nuPQbkbZZ59AojkFiaUEjBW1X0DbVVCupicpeQmGw0D35RupSusvMzOVKgHO91rbrWunibw/640?wx_fmt=png&from=appmsg&watermark=1#imgIndex=39)

在 getVD 了里面同样调用了随机生成函数 sub_A6620, 既然这样，我们需要确定这个函数调用生成的值是否和我们最后结果是一致的，我们简单 hook 一下。不演示了，是一致的