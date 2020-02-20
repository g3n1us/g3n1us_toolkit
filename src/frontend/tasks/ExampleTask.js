
class ExampleTask{

	constructor(Fah){
		// Fah = Functions and Handlers
		this.fah = Fah;
		this.push();
	}

	push(context){
		const testHandler = () => {
			// this function is the first argument to `push` and is called if the second function returns true
			console.log('There are three things in the array!!!');
		}

		const testFunction = () => {
			// the second function, this one, determines if the task should run. Return true if it should and anything else if it should not
			// if it runs, it will be removed from the Fah queue. If it needs to be pushed back into the queue, just run `push` again.
			return [1, 2, 3].length === 3;
		}

		// The argument to this function is the context (this) that the task should be run under.
		// It is bound to both functions
		this.fah.push(testHandler, testFunction, context);
	}

}

export default ExampleTask;
