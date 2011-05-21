exports.newTemplate= function(isAcceptor,isDuplicate,isAuthentic,getSeqNums, recordMsg) {
    return new template(session);
};

var fixutil = require('./fixutils.js');


function template(isAcceptor,isDuplicate,isAuthentic,getSeqNums,recordMsg){
	var isInitiator = !isAcceptor;
	
	var sendHeartbeats = true;
	var expectHeartbeats = true;
	var respondToLogon = true;
	
    var isLoggedIn = false;
    var heartbeatIntervalID = "";
    var timeOfLastIncoming=newDate().getTime();
    var testRequestID = 1;
    var incomingSeqNum = 1;
    var outgoingSeqNum = 1;
    var isResendRequested = false;
    
    var self = this;

    //||||||||||INCOMING||||||||||INCMOING||||||||||INCOMING||||||||||INCOMING||||||||||INCOMING||||||||||INCOMING||||||||||
    this.incoming = function(ctx, event){
        if(event.type !== 'data'){
            ctx.sendNext(event);
            return;
        }

        timeOfLastIncoming = new Date().getTime();

        //==Convert to key/val map==
        var raw = event.data;
        var fix = fixutil.converToMap(raw);

        var msgType = fix['35'];

        //==Confirm first msg is logon==
        if(isLoggedIn === false && msgType !=='A'){
            var error = '[ERROR] First message must be logon:'+raw;
            sys.log(error);
            ctx.stream.end();
            ctx.sendNext({data:error, type:'error'});
            return;
        }

        //==Process logon 
        else if(isLoggedIn === false && msgType === 'A'){
            var fixVersion = fix['8'];
            var senderCompID = fix['56'];
            var targetCompID = fix['49'];
                        
            //==Process acceptor specific logic
            if(isAcceptor){
                //==Check duplicate connections
                if(isDuplicate(senderCompID, targetCompID)){
                    var error = '[ERROR] Session already logged in:'+raw;
                    sys.log(error);
                    ctx.stream.end();
                    ctx.sendNext({data:error, type:'error'});
                    return;
            	}

                //==Authenticate connection
                if(isAuthentic(fix,ctx.stream.remoteAddress)){
                	if(isDuplicate(senderCompID, targetCompID)){
                        var error = '[ERROR] Session not authentic:'+raw;
                        sys.log(error);
                        ctx.stream.end();
                        ctx.sendNext({data:error, type:'error'});
                        return;
                	}

                }
            }//End Process acceptor specific logic==
            
            //==Sync sequence numbers from data store
            var seqnums = getSeqNums(senderCompID, targetCompID);
            self.incomingSeqNum = seqnums.incomingSeqNum;
            self.outgoingSeqNum = seqnums.outgoingSeqNum;


            var heartbeatInMilliSecondsStr = fix[108] || '30';
            var heartbeatInMilliSeconds = parseInt(heartbeatInMilliSeconds,10) * 1000;
            
            //==Set heartbeat mechanism
            self.heartbeatIntervalID = setInterval(function(){
                var currentTime = new Date().getTime();
                
                //==send heartbeats
                if(currentTime - self.timeOfLastOutgoing > heartbeatInMilliSeconds && self.sendHeartbeats){
                    ctx.sendPrev({data:{'35':'0'}, type:'data'});//heartbeat
                }
                
                //==ask counter party to wake up
                if(currentTime - self.timeOfLastIncoming > heartbeatInMilliSeconds && self.expectHeartbeats){
                    ctx.sendPrev({data:{'35':'1', '112':self.testRequestID++}, type:'data'});//test req id
                }
                
                //==counter party might be dead, kill connection
                if(currentTime - self.timeOfLastIncoming > heartbeatInMilliSeconds * 1.5 && self.expectHeartbeats){
                    var error = '[ERROR] No heartbeat from counter party in milliseconds ' + heartbeatInMilliSeconds * 1.5;
                    sys.log(error);
                    ctx.stream.end();
                    ctx.sendNext({data:error, type:'error'});
                    return;
                }

            }, heartbeatInMilliSeconds/2);//End Set heartbeat mechanism==

            //==When session ends, stop heartbeats            
            ctx.stream.on('end', function(){clearInterval(self.heartbeatIntervalID);});

            //==Logon successful
            isLoggedIn = true;
            
            //==Logon ack (acceptor)
            if(isAcceptor && respondToLogon){
                if(respondToLogon){ ctx.sendPrev({data:fix, type:'data'});}
            }
            
        }// End Process logon==
        
        //==Record message
        recordMsg(senderCompID, targetCompID, raw);
        
        //==Process seq-reset (no gap-fill)
        if(msgType === '4' && fix['123'] ===  undefined  || fix['123'] === 'N'){
            var resetseqnostr = fix['36'];
            var resetseqno  = parseInt(resetseqno,10);
            if(resetseqno >= self.incomingSeqNum){ self.incomingSeqNum = resetseqno }
            else{
                    var error = '[ERROR] Seq-reset may not decrement sequence numbers: ' + raw;
                    sys.log(error);
                    ctx.stream.end();
                    ctx.sendNext({data:error, type:'error'});
                    return;
            }
        }
        
        //==Check sequence numbers
        var msgSeqNumStr = fix['34'];
        var msgSeqNum = parseInt(msgSeqNumStr,10);
        
        //expected sequence number
        if(msgSeqNum === self.incomingSeqNum){
            self.incomingSeqNum ++;
            self.isResendRequested = false;
        }
        //less than expected
        else if(msgSeqNum < self.incomingSeqNum){
            //ignore posdup
            if(fix['43'] === 'Y'){ return; } 
            //if not posdup, error
            else{
                    var error = '[ERROR] Incoming sequence number lower than expected ('+msgSeqNum+') : ' + raw;
                    sys.log(error);
                    ctx.stream.end();
                    ctx.sendNext({data:error, type:'error'});
                    return;
            }
        }
        //greater than expected
        else{
            //is it resend request?
            ...?
        }
        
    }
    
    //||||||||||OUTGOING||||||||||OUTGOING||||||||||OUTGOING||||||||||OUTGOING||||||||||OUTGOING||||||||||OUTGOING||||||||||
    this.outgoing = function(ctx, event){
        ctx.sendNext(event);
     }

}
