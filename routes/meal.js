/**
 *  订餐 Routes
 */
var Meal = require('../models/meal.js');
var Order = require('../models/meal_order.js');
//订餐首页
var index = function(req,res){
     var condition = {
      query: {
        handpick: '1'
      },
      sort: {
        _id: -1
      },
      limit: 4
     }

     Meal.get(condition, function(err, meals) {
      if(err) {
        meals = [];
      }
      res.render('./meal/index', {
        title: '订餐',
        user: req.session.user,
        meals: meals,
        cur: 'meal',
        cat: ''
      });
     });
}
//菜品详情
var detail = function(req,res){
    var condition = {};
    condition.query = {
      id: parseInt(req.params[0], 10)
    };
    Meal.get(condition, function(err, meals) {
      if(err) {
        meals = [];
      }
      if(!meals[0]) {
        return res.redirect('/meal')
      }
      res.render('./meal/detail', {
        title: meals[0].name + '的详情',
        user: req.session.user,
        meals: meals[0],
        cur: 'meal',
        cat:''
      });
    });
}

//菜品分类
var category = function(req,res){
     var condition={};
     var cat_title;
     if(req.params[0]){
       condition.query={
         cat : req.params[0]
       };
     }else{
       condition.sort={
         like : -1
       };
       condition.limit=12;
     }
     switch(req.params[0]){
        case '1':
          cat_title="早餐";
          break;
        case '2':
          cat_title="午餐";
          break;
        case '3':
          cat_title="下午茶";
          break;
        case '4':
          cat_title="晚餐";
          break;
        default:
          cat_title="热门";
     }
     Meal.get(condition,function(err,meals){
      if(err){
        meals=[];
      }
       res.render('./meal/category',{
           title : '菜品分类'
          ,user : req.session.user
          ,cat : cat_title
          ,meals : meals
          ,cur : 'meal'
       });
     });
}
//订餐清单
var orderlist = function(req,res){
   var condition={};
   condition.query={
       uid : parseInt(req.session.user.uid,10)
      ,donestatus : false
   };
   Order.get(condition,function(err,orders){
      if(err){
        orders=[];
      }
      var orderLen = orders.length
         ,subLen = 0
         ,sendLen = 0
         ,curOrder={};
      orders.forEach(function(item,index){
        if(item.substatus){
           if(item.sendstatus){
             sendLen++;
           }else{
             subLen++;
           }
        }else{
           curOrder.mealid=item.id;
           curOrder.orderlist = item.orderlist;
        }
      });
      res.render('./meal/list',{
         orders : curOrder
        ,subLen : subLen
        ,sendLen : sendLen
        ,orderLen : orderLen 
      }); 
   });
}
//增加新订单
var newlist = function(req,res){
     var order = new Order({
        uid : req.session.user.uid
       ,username : req.session.user.username
       ,subtime : 0
       ,donetime : 0
       ,substatus : false
       ,donestatus : false
       ,sendstatus : false
       ,orderlist :[]
     });
     var item = {
        mealname : req.body.meal_name
       ,mealprice : req.body.meal_price
     };
     order.orderlist.push(item);
     if(!!parseInt(req.body.mealid)){//增加同个订单的一条记录
       var id=parseInt(req.body.mealid);
       var condition={
           handle : '1'
          ,update :{
            orderlist : item
          }
       };
       Order.update(id,condition,function(err){
         if(err){
          return res.json({flg:0,msg:err});
         }
         return res.json({flg:1,msg:'加入订单成功！'});
       });
     }else{//增加新订单
       order.save(function(err,id){
         if(err){
           return res.json({flg:0,msg:err});
         }
         return res.json({flg:1,meal:id,msg:'加入成功！'});
       });  
     }
}
//删除订单
var deleteOne = function(req,res){
   var id = parseInt(req.body.mealid);
   var item = {
      mealname : req.body.meal_name
     ,mealprice : req.body.meal_price
   };
   var condition = {
      handle : '2'
     ,update : {
       orderlist : item
     }
   };
   Order.update(id,condition,function(err){
     if(err){
       return res.json({flg:0,msg:err});
     }
     return res.json({flg:1,msg:'删除成功！'});
   });
}
//菜品的喜欢按钮
var like = function(req,res){
  Meal.like(parseInt(req.body.id),req.session.user.uid,function(err){
    if(err){
      return res.json({flg:0,msg:err});
    }
    return res.json({flg:1,msg:'喜欢成功！'});
  });
}
//提交订单，更改成提交状态
var suborder = function(req,res){
   var id = parseInt(req.body.mealid,10);
   var condition={};
   condition.update={
      subtime : Date.now()
     ,substatus : true
   };
   Order.update(id,condition,function(err){
     if(err){
      return res.json({flg:0,msg:err});
     }
     return res.json({flg:1,msg:'提交成功！'});
   });
}
//历史订单 1:已提交的订单
var subed = function(req,res){
   var uid = parseInt(req.session.user.uid,10);
   var condition={};
   condition.query={
      uid : uid
     ,substatus : true
     ,sendstatus : false
   };
   condition.sort={
     subtime:-1
   };
   Order.get(condition,function(err,orders){
     if(err){
       orders=[];
     }
     res.render('./meal/order_sub',{
       title :'等待配送的订单'
      ,user : req.session.user
      ,orders : orders
      ,cur : 'meal'
      ,orderCur : 'sub'
     });
   });
}
//历史订单 2:已经配送的订单
var sended = function(req,res){
   var uid = parseInt(req.session.user.uid,10);
   var condition={};
   condition.query={
      uid : uid
     ,sendstatus : true
     ,donestatus : false
   };
   condition.sort={
     subtime:-1
   };
   Order.get(condition,function(err,orders){
     if(err){
       orders=[];
     }
     res.render('./meal/order_send',{
       title :'已配送的订单'
      ,user : req.session.user
      ,orders : orders
      ,cur : 'meal'
      ,orderCur : 'send'
     });
   });
}
//历史订单 3：已经完成的订单
var done = function(req,res){
   var uid = parseInt(req.session.user.uid,10);
   var condition={};
   condition.query={
      uid : uid
     ,sendstatus : true
     ,donestatus : true
   };
   condition.sort={
     subtime:-1
   };
   Order.get(condition,function(err,orders){
     if(err){
       orders=[];
     }
     res.render('./meal/order_done',{
       title :'已完成的订单'
      ,user : req.session.user
      ,orders : orders
      ,cur : 'meal'
      ,orderCur : 'done'
     });
   });
}
//确认收菜，交易完成
var doneconfirm = function(req,res){
   var id = parseInt(req.body.mealid);
   var condition={};
   condition.update = {
      donetime : Date.now()
     ,donestatus : true
   };
   Order.update(id,condition,function(err){
      if(err){
        return res.json({flg:0,msg:err});
      }
      return res.json({flg:1,msg:'交易完成！'});
   });
}
//对外接口
exports.index = index;
exports.detail = detail;
exports.category = category;
exports.orderlist = orderlist;
exports.newlist = newlist;
exports.deleteOne = deleteOne;
exports.like = like;
exports.suborder = suborder;
exports.subed = subed;
exports.sended = sended;
exports.done = done;
exports.doneconfirm = doneconfirm;

/*-------------
      admin
 -------------*/
var fs = require('fs');
//订单管理
var admin = function(req,res){
  var condition = {};
  condition.query = {//所有提交而未完成状态的订单
     substatus : true
    ,donestatus : false
  };
  condition.sort = {//按提交时间逆序
    subtime : -1
  }
  Order.get(condition,function(err,orders){
    if(err){
      orders=[];
    }
    res.render('./admin/meal/index',{
       title : '订餐管理-订单管理'
      ,user : req.session.admin
      ,orders : orders
      ,cur : 'meal'
    });
  });
}
//订单删除
var delOrderlist = function(req,res){
  var id = parseInt(req.body.id);
  Order.del(id,function(err){
    if(err){
      return res.json({flg:0,msg:err});
    }
    return res.json({flg:1,msg:'删除成功！'});
  });
}

//订单的已发单状态
var sendStatus = function(req,res){
  var id = parseInt(req.body.id);
  var condition = {};
  condition.update={
    sendstatus : true
  }
  Order.update(id,condition,function(err){
    if(err){
      return res.json({flg:0,msg:err});
    }
    return res.json({flg:1,msg:'发单成功！'});
  });
}
//菜品管理
var mealManager = function(req,res){
  Meal.get({},function(err,meals){
    if(err){
      meals=[];
    }
    res.render('./admin/meal/control',{
       title : '订餐管理-菜品管理'
      ,user : req.session.admin
      ,meals : meals
      ,cur : 'meal'
    });
  });
}
//添加新菜品
var addMeal = function(req,res){
  if(req.method == 'GET'){
    res.render('./admin/meal/add',{
       title : '订餐管理-添加新菜品'
      ,user : req.session.admin
      ,cur : 'meal'
    });    
  }else if(req.method == 'POST'){
    var pic = req.files.upload;
    var meal = new Meal({
       name : req.body.meal_name
      ,cat : req.body.meal_cat
      ,supplier : req.body.meal_supplier
      ,price : req.body.meal_price
      ,description : req.body.meal_description
      ,pic : pic.name
      ,handpick : req.body.meal_handpick
    });
    var tempPath = pic.path;
    var targetPath='public/images/meal/'+pic.name;
    meal.save(function(err){
      if(err){
        return res.json({flg:0,msg:err});
      }
      //存储图片
        fs.rename(tempPath,targetPath,function(err){
           if(err){
             res.json({flg:0,msg:err});
           }
        }); 
        res.redirect('/admin/meal/control');
     });    
  }
}
//删除菜品
var delMeal = function(req,res){
  Meal.del(parseInt(req.body.id,10),function(err){
  if(err){
    return res.json({flg:0,msg:err});       
  }
  return res.json({flg:1,msg:'删除成功！'});
 });
}
//修改菜品
var modifyMeal = function(req,res){
  if(req.method == 'GET'){
    var condition = {
      query :{
        id: parseInt(req.params[0],10)
      }
      ,limit : 1
    }
    Meal.get(condition,function(err,meals){
      if(err){
        meals=[];
      }
      res.render('./admin/meal/edit',{
         title : '菜品修改'
        ,user : req.session.admin
        ,meals : meals[0]
        ,cur : 'meal'
      });
    });    
  }else if(req.method == 'POST'){
     var like =req.body.meal_like.split(',');
     var pic = req.files.upload;
     var meal = new Meal({
        id : parseInt(req.body.id,10)
       ,name : req.body.meal_name
       ,cat : req.body.meal_cat
       ,like : like
       ,supplier : req.body.meal_supplier
       ,price : req.body.meal_price
       ,pic : pic.name
       ,description : req.body.meal_description
       ,handpick : req.body.meal_handpick
     });
     var tempPath = pic.path;
     var targetPath = 'public/images/meal/'+pic.name;
     meal.modify(meal,function(err){
       if(err){
        return res.json({flg:0,msg:err});
       }
       fs.rename(tempPath,targetPath,function(err){
         if(err){
          return res.json({flg:0,msg:err});
         }
       });
       res.redirect('/admin/meal/control');
     });    
   }
}
//对外接口
exports.admin = admin;
exports.delOrderlist = delOrderlist;
exports.sendStatus = sendStatus;
exports.mealManager = mealManager;
exports.addMeal = addMeal;
exports.delMeal = delMeal;
exports.modifyMeal = modifyMeal;
