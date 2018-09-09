var Node          = require('./Node');
var rxjs          = require('rxjs');

class Queue {

  // var head = null;
  // var tail;

  // var observer: Observer<Node> = null;
  // var this$PiFrame = null;
  // var timerSubscription = null;

  // // A timer subscription that keeps sending new images to the observer
  // executeSubscription() {

  //   // Check if there is an element in the list
  //   if (this.head != null) {

  //     // If the current node at head is a folder, unsubscribe the listener
  //     if (this.head.data['id'].startsWith('folder')) {
  //       this.timerSubscription.unsubscribe();
  //     }

  //     // Pop a node from the list and pass on to observer
  //     this.observer.next(this.this$PiFrame.pop());

  //   } else {

  //     // If no nodes are left, unsubscribe from the timer
  //     this.timerSubscription.unsubscribe();

  //     console.log('No items left on the queue. Deactivating timer subscription.');
  //   }
  // }

  constructor() {
        this.head = null;
        this.tail = null;

        this.timer = rxjs.timer(1000, 5000);
        // Create a new observable for the head that is subscribed to. The observer is extracted and handled manually
        this.observable = new rxjs.Observable(observer => {
            console.log('A new observer has subscribed to the queue.');

            // Store the observer in a variable to call .next() manually.
            this.observer = observer;
        });
  }

  /**
   * Adds a new item to the queue
   * @param newItem The new item to be pushed to the queue
   */
    add(newItem) {
        // Create a new Node from the item received
        const node = new Node();
        node.set(newItem);

        // If the queue head is empty, add the new item received to the head and the tail
        if (this.head == null) {
            this.head = node;
            this.tail = node;

            // Log out the operation
            console.log('Item with ID : ' + this.head.data['id'] + ' and name ' + this.head.data['name'] + ' added to head. Total number in the queue: ' + this.count());

            // Begin emitting objects for the attached observer
            if (this.observer != null) {

                // Setup a timer to pop every 300 ms
                // this.timer.subscribe(this.this$PiFrame.timerSubscription);
                this.timerSubscription = this.timer.subscribe(() => this.executeSubscription(), () => {}, () => {});
            }
        } else {

            // Set the new received node as the 'next' node of the current node
            this.tail.next = node;

            // Update the current tail with the one received
            this.tail = node;

            // Log out the operation
            console.log('Item with ID : ' + this.tail.data['id'] + ' and name ' + this.tail.data['name'] + ' added to tail. Total number in the queue: ' + this.count());
        }
    }

  /**
   * Retrieves the first item from the queue.
   */
   pop() {
    // If head is null, there's nothing on the list
    if (this.head == null) {
        return null;
    } else {
      // Get the item that will be popped from the queue
      const extractedItem = this.head;

      // Set the next item in the queue as the new head
      this.head = this.head.next;

      // Returned the previous head
      return extractedItem;
  }
}

  /**
   * Count the number of items in the queue and return to the caller
   */
   count() {
       if (this.head == null) {
           return 0;
       } else {
           let intCounter = 1;
           let countHead = this.head;
           while (countHead.next != null) {
               intCounter++;
               countHead = countHead.next;
           }

           return intCounter;
       }
   }

   // A timer subscription that keeps sending new images to the observer
  executeSubscription() {

    // Check if there is an element in the list
    if (this.head != null) {

      // If the current node at head is a folder, unsubscribe the listener
      if (this.head.data['folder']) {
        this.timerSubscription.unsubscribe();
      }

      // Pop a node from the list and pass on to observer
      this.observer.next(this.pop());

    } else {

      // If no nodes are left, unsubscribe from the timer
      this.timerSubscription.unsubscribe();

      console.log('No items left on the queue. Deactivating timer subscription.');
    }
  }
}

//Export to module to make it available globally
module.exports = Queue; 