<template>
  <div id="user">
    <h2>我是用户</h2>
    <p>获取的用户是{{$route.params.id}}</p>
  </div>
</template>

<script>
export default {
  name: 'user',
    created:function(){
    console.log("user create")
  },
  destroyed:function(){
    console.log("user destroyed");
  }
}
</script>

