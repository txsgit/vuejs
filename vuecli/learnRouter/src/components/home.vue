<template>
  <div id="home">
    <h2>我是首页</h2>
    <p>我是首页内容。。。。</p>
     <router-link to="/home/homenews">新闻</router-link> 
     <router-link to="/home/homemessage">用户</router-link> 
    <router-view/>
  </div>
</template>

<script>
export default {
  name: 'home',
   created:function(){
    console.log("home create")
  },
  destroyed:function(){
    console.log("home destroyed");
  }
}
</script>

<style >
 .active {
    color:red;
 }
</style>

