<template>
  <div id="app">
   <router-link to="/home" >首页</router-link>
    <router-link to="/about">关于</router-link> 
     <router-link v-bind:to="'/user/'+userId">用户</router-link> 
     <!-- <router-link v-bind:to="{path:'/profile',query:{name:'txs',age:18,heigth:1.88}}">档案</router-link>  -->
     <button @click="profile()">档案</button> 
      <button @click="getuserinfo()">用户详细信息</button> 

       <!--保持keep-alive内的组件不被销毁，除了嵌套组件外 ,exclude排除路由组件profile和user组件不需要缓存 -->
      <keep-alive exclude="profile,user">

        <router-view/>
      </keep-alive>
    
    <!-- <button @click="fclick">首页</button>
    <button @click="Aclick">关于</button> -->
  </div>
</template>

<script>
export default {
  name: 'App',
  data (){
    return {
      userId:'ssss',
      userinfo:{
        id:123,
        name:'tsx',
        age:12
      }
    }
  },
  methods:{
    fclick:function()
    {
      console.log("首页");
      // this.$router.push("/home")
       this.$router.replace('/home');
      
    },
    Aclick:function()
    {
      console.log("关于");
      // this.$router.push("/about")
      this.$router.replace('/about');
     
      
    },
    getuserinfo:function()
    {

      //使用path定义路由路径 params参数忽略，使用name定义路由 params参数才生效
      //  this.$router.push({
      //    name:'userinfo',  //params传参使用name
      //    params:{
      //     info:this.userinfo
      //    }
      //  })
       this.$router.replace({
         name:'userinfo',  //params传参使用name
         params:{
          info:this.userinfo
         }
       })
    },
    profile:function()
    {
      //query传参,可以使用path
       this.$router.replace({
         path:'/profile',  //params传参使用name
         query:{
         name:'txsee',
         age:18,
         heigth:1.88
         }
       })
    }
  }
}
</script>
<style >
 .active {
    color:red;
 }
</style>

