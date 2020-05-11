<template>
  <div id="about">
    <h2>我是关于</h2>
    <p>我是关于内容。。。。</p>
  </div>
</template>

<script>
export default {
  name: 'about',
  created:function(){
    console.log("about create")
  },
  destroyed:function(){
    console.log("about destroyed");
  }
}
</script>

