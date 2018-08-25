/*
 *
 *
 *       Complete the API routing below
 *
 *
 */

'use strict';

var expect = require('chai').expect;
var chaiHttp = require('chai-http');
var chai = require('chai');
var assert = chai.assert;
const mongoose = require('mongoose');
mongoose.connect(process.env.DB, {
  useNewUrlParser: true
});
var Schema = mongoose.Schema;
//
var childSchema = new Schema({
  
  text: String,
  delete_password: String,
  reported: Boolean
}, {
  timestamps: {
    createdAt: 'created_on',
    updatedAt: 'bumped_on'
  }
})

var blogSchema = new Schema({
  text: String,
  delete_password: String,
  reported: Boolean,
  replies: [childSchema],
  replycount:Number
}, {
  timestamps: {
    createdAt: 'created_on',
    updatedAt: 'bumped_on'
  }
})
//const Board_messageDB= 
function Board_messageDB(board) {
  return mongoose.model(board, blogSchema);
}

module.exports = function (app) {

  app.route('/api/threads/:board')
    .post(function (req, res) {
     // console.log(req.params.board)
      var board = req.params.board
      var text = req.body.text
      var delete_password = req.body.delete_password
   //   console.log((req.body))
      const kitty = new Board_messageDB(board)({
        text: text,
        delete_password: delete_password,
        reported:false,
        replycount:0
      });
      new Promise(function (resolve, reject) {
      kitty.save(function (err, doc) {
        if (err) return res.send(err);
      // res.send(doc); 
        resolve(doc);   
        res.redirect('/b/' + req.params.board +'/')

      });
      })
    })

    .get(function (req, res) {
      var board = req.params.board;
      //console.log('get56: ' + JSON.stringify(board));

      var query = Board_messageDB(board).find({}, {
        replies: {
          $slice: -3
        },
        delete_password: 0,
        reported: 0,
        'replies.delete_password': 0,
        'replies.reported': 0
      })
      query
        .limit(10)
        .sort({
          bumped_on: 'desc'
        })
   query.exec(function (err, doc) {
        if (err) {
          res.send(err);
        } // handle error
      //  console.log(JSON.stringify(doc))
        res.send(doc);
      });
    })
    .put(function (req, res) {
    
     var board = req.params.board;    
      var _id = req.body.thread_id; //console.log('put: ' + board +_id+ 'body:' + (req.body));
      Board_messageDB(board).findById(_id,
        function (err, docs) {
          if (!docs) {
            res.send('First add new user');
          }
          else {   
                docs.set({ ['reported']:true})
                           docs.save(function (err, docs) {
              if (err) return res.json('could not update ' + _id+err);
              res.send('success');  //console.log(docs);
                return docs;
            });
                  }
        });

    })
    .delete(function (req, res) {
      var board = req.params.board;
    //  console.log('del: ' + board + 'body:' + JSON.stringify(req.body));
      var _id = req.body.thread_id;
      var password = req.body.delete_password;
      if (!Boolean(_id)) {
        // console.log('del: ' + Boolean(_id));
        res.send('_id error');
        return '_id error';
      } else {
        Board_messageDB(board).findOneAndDelete({
          _id: _id,
          delete_password: password
        }, function (err, doc) {
          if (err) return res.send('could not delete ' + _id);
        if (doc) { res.send( 'success');}else{ res.send('incorrect password' )}
        }); //Removes the document
      }
    });

  ;

  app.route('/api/replies/:board')
    .post(function (req, res) {
      var board = req.params.board
      var text = req.body.text
      var delete_password = req.body.delete_password
      var _id = req.body.thread_id;
   // console.log(JSON.stringify(req.body) );
      Board_messageDB(board).findById(_id, function (err, pdoc) {
        pdoc.replies.push({
          text: text,
          delete_password: delete_password,
          reported: false
        });
        pdoc.replycount++ 
        new Promise(function (resolve, reject) {
        pdoc.save(function (err, doc) {
          if (err) return res.send(err);
          // res; 
          resolve(doc); 
       //     console.log('api0'+JSON.stringify(doc) );
          res.redirect('/b/' + req.params.board + '/' + _id + '/')
        
        });
        })
      });
    })

    .get(function (req, res) {
      var board = req.params.board;

      var _id = req.query.thread_id;
   //   console.log('api1'+JSON.stringify(req.body.thread_id) + JSON.stringify(req.params) + _id);
      var query = Board_messageDB(board).findById(
         _id
      , {
        'delete_password': 0,
        'reported': 0,
        'replies.delete_password': 0,
        'replies.reported': 0
      })
query.exec(function (err, doc) {
        if (err) {
          res.send('err' + err);
        } // handle error
      //    console.log('api'+JSON.stringify(doc))
        res.send(doc);
      
      })  
  })
 .put(function (req, res) {
     var board = req.params.board;    
      var _id = req.query.thread_id;
     var reply_id = req.query.reply_id;
     // console.log('put: '+JSON.stringify(req.body) +board + 'id:' + _id+'replyid'+reply_id);
      Board_messageDB(board).findById(_id,
        function (err, docs) {
        if(docs){
          try{   docs.replies.id(reply_id)['reported']=true
                  
        docs.save(function (err, docs) {
              if (err) return res.send('could not update ' + _id+err);
              res.send('success'); // console.log(docs);
                return docs;
            });    
          
          } catch(err){
            res.send('not valid reply_id ')
          }
                     
        }else{  res.send('not valid thread_id ')}});
    })
  .delete(function (req, res) {
     var board = req.params.board;    
      var _id = req.body.thread_id;
     var reply_id = req.body.reply_id;
     var delete_password = req.body.delete_password;
     // console.log('put: '+JSON.stringify(req.body) +board + 'id:' + _id+'replyid'+reply_id);
      Board_messageDB(board).findById(_id,
        function (err, docs) {
          if (err)  res.send('could not update ' + _id+err);
     //   console.log('api'+docs.replies)
        if(docs.replies.id(reply_id).delete_password==delete_password){
          try{   docs.replies.id(reply_id).remove()
         docs.replycount--          
        docs.save(function (err, docs) {
              if (err) return res.send('could not update ' + _id+err);
              res.send('success');  //console.log(docs);
              
                return docs;
            });    
          
          } catch(err){
            res.send('not valid reply_id ')
          }
                     
        }else{  res.send('incorrect password')}});
    })
  ;
};