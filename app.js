const mongodb = require('mongodb').MongoClient;
const client = require('socket.io').listen(2000).sockets; // to make it run on this port

// connect to mongo
mongodb.connect('mongodb://127.0.0.1/chatapp', (err, db) => {
    if (err) throw err;
    console.log('mongodb connected...');

    // connect to socket.io
    client.on('connection', (socket)=>{
        let chat = db.collection('chats'); // if doesn't exist make it else connect to it
        
        // create fcn to send status
        sendStatus = function(s){
            socket.emit('status', s);
        }

        // get chats from mongo collection
        chat.find().limit(100).sort({_id:1}).toArray((err, result)=>{
            if (err) throw err;

            // emit messages
            socket.emit('output', result);
        });

        // handle input events
        client.on('input', (data) => {
            let name = data.name;
            let msg = data.msg;

            // check for name and message 
            if(name == '' || msg == ''){
                // send error status
                sendStatus('Please enter a name and a message');
            } else {
                // insert message to db
                chat.insert({ name : name, msg : msg}, () => {
                    client.emit('output', [data]);

                    // send status object 
                    sendStatus({
                        message : 'message sent',
                        clear : true
                    })
                });
            }

        });

        // handle clear
        socket.on('clear', () => {
            // remove all chats from collection
            chat.remove({}, () => {
                // Emit cleared
                socket.emit('cleared');
            })
        });
    });
});