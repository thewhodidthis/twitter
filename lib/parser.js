'use strict';

const EventEmitter = require('events');

class Parser extends EventEmitter {
  constructor(end) {
    super(end);
   
    this.messageTypes = Parser.messageTypes.split(' ');
    this.messageEnd = end && end.toString() || Parser.END;
    this.message = '';
    this.ended = -1;
  }

  parse(buffer) {
    this.message += buffer.toString('utf8');
    this.ended = this.message.indexOf(this.messageEnd);

    if (this.ended !== -1) {
      var message = this.message.slice(0, this.ended);

      try {
        var json = JSON.parse(message);
        var eventType = 'data';

        this.messageTypes.forEach(type => {
          if (json.hasOwnProperty(type)) {
            eventType = type;
          }
        });

        this.emit(eventType, json);
      } catch (error) {
        this.emit('error', error);
      }
      
      this.message = this.message.slice(this.ended + this.messageEnd.length);
    }
  }
}

Parser.END = '\r\n';
Parser.messageTypes = 'delete scrub_geo limit status_withheld user_withheld disconnect warning friends event for_user control';

module.exports = Parser;
