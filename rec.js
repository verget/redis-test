RedisSMQ = require("rsmq");
rsmq = new RedisSMQ( {host: "127.0.0.1", port: 6379, ns: "rsmq"} );

let key = Math.round(Math.random() * 1000);
let count = 0;
console.log(key);

const receiver = () => {
  rsmq.popMessage({qname:"myqueue"}, (err, resp) => {
    if (resp && resp.id) {
       count++;
       console.log(count, resp.id);
    }
    setTimeout(() => {
      return receiver();
    }, 5);
  });
};

receiver();