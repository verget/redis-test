const redis = require("redis");

RedisSMQ = require("rsmq");
rsmq = new RedisSMQ( {host: "127.0.0.1", port: 6379, ns: "rsmq"} );

let instanceKey = Math.round(Math.random() * 1000);

const imDaddy = () => {
  setInterval(() => {
    rsmq.sendMessage({qname: "whosDaddy", message: new Date()}, (err, resp) => {
      console.log(instanceKey);
    });
  }, 500);
};

const daddyTracking = () => {
  const daddyInterval = setInterval(() => {
    rsmq.popMessage({qname: "whosDaddy"}, (err, resp) => {
      console.log(resp);
      if (resp.id) {
        console.log("old daddy living", resp);
      } else {
        console.log("Now " + instanceKey + " is your daddy");
        clearInterval(daddyInterval);
        return imDaddy();
      }
    });
  }, 100);
};

rsmq.getQueueAttributes({qname: "whosDaddy"}, (err, resp) => {
  if (err && err.name == "queueNotFound") {
    return rsmq.createQueue({qname: "whosDaddy"}, (err, resp) => {
      if (resp === 1) {
        console.log("Now " + instanceKey + " is your daddy");
        imDaddy();
      }
    });
  } else {
    daddyTracking();
  }
});


//
//
// rsmq.deleteQueue({qname:"myqueue"}, (err, resp) => {
//   if (resp === 1) {
//     console.log("queue cleared")
//   }
// });
//
// let limit = 1000,
//   count = 0;
//
// const sender = () => {
//   if (count < limit) {
//     rsmq.sendMessage({qname:"myqueue", message:"Hello World"}, (err, resp) => {
//       console.log(count);
//       count++;
//       return sender();
//     })
//   } else {
//     return referee();
//   }
// };
//
// const referee = () => {
//   rsmq.getQueueAttributes({qname:"myqueue"}, (err, resp) => {
//     if (err) {
//       console.error(err);
//     } else {
//       const finishTime = new Date();
//       console.log("Queue created: " + resp.created + "\n");
//       console.log("Total sent: " + resp.totalsent + "\n");
//       console.log("Total received: " + resp.totalrecv + "\n");
//       console.log("Finish time: " + (finishTime / 1000 - resp.created) + "\n");
//     }
//   });
// };
//
// rsmq.createQueue({qname:"myqueue"}, (err, resp) => {
//   if (resp === 1) {
//     sender();
//   }
// });
