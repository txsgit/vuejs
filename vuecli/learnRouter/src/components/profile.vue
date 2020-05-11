<template>
  <div id="profile">
    <h2>档案</h2>
    <p>获取的档案是</p>
    <ul>
      <!-- <li >
          {{$route.query.name}}      
      </li>
      <li >
          {{$route.query.age}}      
      </li>
      <li >
          {{$route.query.heigth}}      
      </li>
      <li >
          {{msg}}      
      </li> -->
      <li v-for="item in $route.query" :key="item">
          {{item}}      
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  name: 'profile',
   created:function(){
    console.log("profile create")
  },
  destroyed:function(){
    console.log("profile destroyed");
  },
  data:function(){
    return {
      msg:'profile数据'
    }
  }
}
</script>

