<template>
  <div id="userinfo">
    <h2>我是用户详细信息</h2>
    <p>获取的用户详细信息是:</p>
    <ul>
      <li>{{$route.params.info}}</li>
      <!-- <li v-for="item in $route.params" :key="item">
        {{item.id}}
        {{item.name}}
        {{item.age}}
      </li> -->
    </ul>
  </div>
</template>

<script>
export default {
  name: 'userinfo',
  created:function(){
    console.log("userinfo create")
  },
  destroyed:function(){
    console.log("userinfo destroyed");
  }
}
</script>

