
const RedisSMQ = require("rsmq");
const rsmq = new RedisSMQ( {host: "127.0.0.1", port: 6379, ns: "rsmq"} );

let instanceKey = Math.round(Math.random() * 1000);

let daddySettingInterval = '',
    receiverInterval = '';

const param1 = process.argv[2],
      param2 = process.argv[3];

let delay = +param1 || 0,
    limit = +param2 || 1000000,
    sendCount = 0;

const cleaning = () => {
  console.log('cleaning');
  rsmq.deleteQueue({ qname: "channel" }, (err, resp) => {
    if (err) {
      console.error("channel " + err.name);
    } else {
      console.log("channel queue cleared");
    }
    rsmq.deleteQueue({qname: "errors"}, (err, resp) => {
      if (err) {
        console.error("errors " + err.name);
      } else {
        console.log("errors queue cleared");
      }
      process.exit(0);
    });
  });
};

const getErrors = () => {
  rsmq.popMessage({ qname: "errors" }, (err, resp) => {
    if (resp.id) {
      console.log(resp.message);
      getErrors();
    } else {
      console.error(err);
    }
  });
};

if (param1 == 'clear') {
  cleaning();
} else if (param1 == "getErrors") {
  getErrors();
} else if (param1 == "test") {
  const a = setInterval(()=>{},0);
  console.log(typeof a == "object");
} else {
  rsmq.getQueueAttributes({ qname: "channel"} , (err, resp) => {
    console.log(instanceKey);
    if (err && err.name == "queueNotFound") {
      return rsmq.createQueue({ qname: "channel" }, (err, resp) => {
        if (resp === 1) {
          console.log("Now " + instanceKey + " is your daddy");
          imDaddy();
        } else {
          console.error(err);
        }
      });
    } else {
      rsmq.createQueue({ qname: "errors" }, (err, resp) => {
        receiver();
        daddyTracking();
      });
    }
  });
}

const imDaddy = () => {
  if (typeof receiverInterval == "object") {
    console.log("clear rec");
    clearInterval(receiverInterval);
  }
  generate();
  rsmq.setQueueAttributes({ qname: "channel", vt: 0 }, (err, resp) => {});
  daddySettingInterval = setInterval(() => {
    rsmq.setQueueAttributes({ qname: "channel", vt: 0 }, (err, resp) => {});
  }, 1000);
};

const daddyTracking = () => {
  const daddyTrackingInterval = setInterval(() => {
    rsmq.getQueueAttributes({ qname: "channel" }, (err, resp) => {
      const now = Math.floor(Date.now() / 1000);
      if ((now - resp.modified) <= 1) {
        return;
      }
      clearInterval(daddyTrackingInterval);
      if (resp.totalrecv < limit) {
        console.log("Now " + instanceKey + " is your daddy");
        return imDaddy();
      } else {
        process.exit(0);
      }
    });
  }, 1000);
};

const generate = () => {
  if (sendCount < limit) {
    sendCount++;
    rsmq.sendMessage({ qname: "channel", message: "" + sendCount + "-" }, (err, resp) => {
      process.stdout.write('PUB ' + sendCount + '-\n\r');
      return generate();
    })
  } else {
    stopSending();
  }
};

const receiver = () => {
  receiverInterval = setInterval(() => {
    rsmq.popMessage({qname: "channel"}, (err, resp) => {
      if (!err && resp.id) {
        process.stdout.write('SUB ' + resp.message + '\n\r');
        isError(resp.message);
      }
    });
  }, 0);
};

const referee = () => {
  rsmq.getQueueAttributes({ qname:"errors" }, (err, errorsResp) => {
    const errors = errorsResp ? errorsResp.totalsent : 0;
    rsmq.getQueueAttributes({ qname:"channel" }, (err, resp) => {
      if (err) {
        return console.error(err);
      } else {
        const finishTime = new Date();
        console.log("Queue created: " + resp.created + "\n");
        console.log("Total sent: " + resp.totalsent + "\n");
        console.log("Total received: " + resp.totalrecv + "\n");
        console.log("Total errors: " + errors + "\n");
        console.log("Finish time: " + (finishTime / 1000 - resp.created) + "\n");
        process.exit(0);
      }
    });
  });
};

const stopSending = () => {
  clearInterval(daddySettingInterval);
  return referee();
};

const isError = (message) => {
  if (Math.random() <= 0.05) {
    rsmq.sendMessage({ qname: "errors", message: message }, (err, resp) => {
      if (err) {
        console.error(err);
      }
      return;
    });
  }
  return;
};

