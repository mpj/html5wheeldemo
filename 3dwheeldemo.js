var circle_radius = 900;
var $active_card;

$(document).ready(function() {


	$("#wheel").rotate(0, 0, 0);
	$active_card = $(".card:first");
	
	$(".card").disableAnimation();
	$(".card").centerHorizontal();
	
	$(".card").enableAnimation();
	$("#wheel").enableAnimation();
	
	var i = 0;
    jQuery(".card").each(function() {
		
		var degrees = calculate_number_of_degrees_per_card() * i;

		var is_active_card_moved_forward = false;
		var $card = $(this);
		$card.rotate(0, degrees, 0, function() {		
			$card.moveBack(function() {	
				if (!is_active_card_moved_forward) {	
					is_active_card_moved_forward = true;
					$active_card.moveForward();	
				}			
			});
		});
		
		i++;
    });
	

	
	jQuery(document).keydown(function(e) {

        var is_key_arrow_left = event.keyCode == 37;
        var is_key_arrow_right = event.keyCode == 39;

		var degrees = calculate_number_of_degrees_per_card();		
		
        if (is_key_arrow_right) {
		   $active_card.moveBack();
		   
		   
           $("#wheel").rotate(0, -degrees, 0, function() {
				if ($active_card.next().length == 0)
					$active_card = $(".card:first");
				else
					$active_card = $active_card.next();
				$active_card.moveForward();
		   });
		}

		if (is_key_arrow_left) {
		   $active_card.moveBack();
		   
           $("#wheel").rotate(0, degrees, 0, function() {
	
				if ($active_card.prev().length == 0)
					$active_card = $(".card:last");
				else
					$active_card = $active_card.prev();
				$active_card.moveForward();
				$active_card.css("-webkit-box-reflect", "below 5px -webkit-gradient(linear, left top, left bottom, from(transparent),color-stop(0.6, transparent), to(rgba(255, 255, 255, 0.5)));");

			
	
		   });
		}
        
		
    });
});






function calculate_number_of_degrees_per_card() {
	var number_of_cards = $(".card").length;
	return (360 / number_of_cards);
}

$.fn.moveBack = function(callback) {
	$(this).translate(0, 0, -circle_radius, callback);
    $(this).css("opacity", "0.6");
}

$.fn.moveForward = function(callback) {
	$(this).translate(0, 0, circle_radius, callback);
    $(this).css("opacity", "1.0");
}



$.fn.centerHorizontal = function() {
    var left = this.parent().width() / 2 - this.width() / 2;
    this.css("left", left);
}

$.fn.disableAnimation = function() {
	$(this).css("-webkit-transition",  "");
}
$.fn.enableAnimation = function() {
	$(this).css("-webkit-transition",  "all 0.5s ease-in-out");
}



$.fn.translate = function(x, y, z, callback) {
    var translate = function(matrix) { return matrix.translate(x, y, z); };
    this.transformCSS(translate, callback);
};

$.fn.rotate = function(x, y, z, callback) {
    var translate = function(matrix) { return matrix.rotate(x, y, z); };
    this.transformCSS(translate, callback);
};

			

$.fn.transformCSS = function(matrixTransformFunction, callback) {

    for (var i = 0; i < this.length; i++) {
        var element = this.get(i);				
		
		if (callback != null) 
			$(element).getElementSpecificQueue().enqueue(callback);

		var computedStyle = window.getComputedStyle(element);
		if (computedStyle == null)
			throw "Could not compute style of " + element + ". Perhaps you are referring to the wrong element? " +
			"If you are nesting callback, make sure you are watching how you use the 'this' keyword";
        var theTransform = computedStyle.webkitTransform;

        if (theTransform != "none") {
            
            // The CSS transform is formatted like so
			// Ex: 'matrix3d(1.2152, 1.221, 8.21212, 8.2211, 3.23232E12, 62.1212)
			// However, the WebKitCSSMatrix contructor will fail if it's fed matrixes with
            // exponential floats ('3.23232E12'), so we parse the transform and round all the numbers down to seven decimals
			
            matrixFunction = (theTransform.substring(0, 8) == "matrix3d") ? "matrix3d" : "matrix";
            var values = theTransform.replace(matrixFunction + "(", "").replace(")", "").split(",");
            for (var x = 0; x < values.length; x++) {
				// Parse the string values as floats and plop them back into the array
                var f = parseFloat(values[x]);
                values[x] = Math.round(f * 1000000) / 1000000;
            }
			// aaand join it back together.
            theTransform = matrixFunction + "(" + values.join(",") + ")";
        }


        var matrix = new WebKitCSSMatrix(theTransform);
        element.style.webkitTransform = matrixTransformFunction(matrix);
				
    }

    
}

$("*").live('webkitTransitionEnd', function(event) { 	
	if (event.originalEvent.propertyName != "-webkit-transform")
		// Ignore other transitions, such as opacity - we are only concerned with transforms
		return;

	var queue = $(this).getElementSpecificQueue();
	if (queue.isEmpty())
		return;
	var queuedCallback = queue.dequeue(); 	
	queuedCallback();

});


/* Gets a queue specific to an element. 
 * Handy for stacking elmenet animations.
 */
$.fn.getElementSpecificQueue = function() {
	var key = "__elementSpecificQueue";
	if ($(this).data(key) == "" || $(this).data(key) == null) 
		$(this).data(key, new Queue());		
	return $(this).data(key);
}


/* Creates a new Queue. A Queue is a first-in-first-out (FIFO) data structure.
 * Functions of the Queue object allow elements to be enqueued and dequeued, the
 * first element to be obtained without dequeuing, and for the current size of
 * the Queue and empty/non-empty status to be obtained.
 */
function Queue(){

  // the list of elements, initialised to the empty array
  var queue = [];

  // the amount of space at the front of the queue, initialised to zero
  var queueSpace = 0;

  /* Returns the size of this Queue. The size of a Queue is equal to the number
   * of elements that have been enqueued minus the number of elements that have
   * been dequeued.
   */
  this.getSize = function(){

    // return the number of elements in the queue
    return queue.length - queueSpace;

  }

  /* Returns true if this Queue is empty, and false otherwise. A Queue is empty
   * if the number of elements that have been enqueued equals the number of
   * elements that have been dequeued.
   */
  this.isEmpty = function(){

    // return true if the queue is empty, and false otherwise
    return (queue.length == 0);

  }

  /* Enqueues the specified element in this Queue. The parameter is:
   *
   * element - the element to enqueue
   */
  this.enqueue = function(element){
    queue.push(element);
  }

  /* Dequeues an element from this Queue. The oldest element in this Queue is
   * removed and returned. If this Queue is empty then undefined is returned.
   */
  this.dequeue = function(){

    // initialise the element to return to be undefined
    var element = undefined;

    // check whether the queue is empty
    if (queue.length){

      // fetch the oldest element in the queue
      element = queue[queueSpace];

      // update the amount of space and check whether a shift should occur
      if (++queueSpace * 2 >= queue.length){

        // set the queue equal to the non-empty portion of the queue
        queue = queue.slice(queueSpace);

        // reset the amount of space at the front of the queue
        queueSpace=0;

      }

    }

    // return the removed element
    return element;

  }

  /* Returns the oldest element in this Queue. If this Queue is empty then
   * undefined is returned. This function returns the same value as the dequeue
   * function, but does not remove the returned element from this Queue.
   */
  this.getOldestElement = function(){

    // initialise the element to return to be undefined
    var element = undefined;

    // if the queue is not element then fetch the oldest element in the queue
    if (queue.length) element = queue[queueSpace];

    // return the oldest element
    return element;

  }

}