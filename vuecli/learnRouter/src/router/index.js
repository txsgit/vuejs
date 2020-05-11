import Vue from 'vue'
import Router from 'vue-router'
// import home from '../components/home'
// import about from '../components/about'
// import user from '../components/user'

//路由js文件懒加载
var home= () => import('../components/home')
var about= () => import('../components/about')
var user= () => import('../components/user')

//嵌套路由 home组件下嵌套2个组件路由
var homenews= () => import('../components/homenews')
var homemessage= () => import('../components/homemessage')
//路由传参
var profile= () => import('../components/profile')
var userinfo= () => import('../components/userinfo')
//使用router
Vue.use(Router)



// 解决两次访问相同路由地址报错
const originalPush = Router.prototype.replace
Router.prototype.replace = function replace(location) {
  return originalPush.call(this, location).catch(err => err)
}

var router= new Router({
  routes: [
    {
      path: '/',
      redirect:'/home' //路径重定向
    },
    {
      path: '/home',
      component: home,
      meta:{ title:'首页'},
      children:[
        {
          path: '',//默认显示
          redirect:'/home/homenews' //路径重定向
        },
        {
          path: 'homenews',
          component: homenews,
        },
        {
          path: 'homemessage',
          component: homemessage,
        }

      ]
    },
    {
      path: '/about',
      meta:{ title:'关于'},
      component: about
    },
    {
      path: '/user/:id',//动态参数以冒号开头
      meta:{ title:'用户'},
      component: user
    },
    {
      path: '/profile',
      meta:{ title:'档案'},
      component: profile
    },
    {
      // path: '/userinfo/:info',
      path: '/userinfo',
      meta:{ title:'详细信息'},
      name:'userinfo',
      component: userinfo
    }
  ],
  mode:'history',   //默认url是hash模式
  linkActiveClass: 'active'  //全局动态样式 每次路由切换成功进入激活状态
})

//全局导航守卫,用来路由切换改变页面title
//前置调用
router.beforeEach((to,from,next) =>{
  next();
  //从from跳转到to
  document.title=to.matched[0].meta.title;
})

export default router
