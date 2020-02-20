import { pull } from 'lodash/array';

class Marshal{

    static instance = null;

    static tasks = {};

    getInstance(){
        return this.constructor.instance || (() => {
            this.constructor.instance = new this.constructor();
            this.constructor.instance.interval();
            return this.constructor.instance;
        })();
    }

    queue = [];

    push = (fn, test, _this) => {
        this.queue.push({fn: fn, test: test, _this: _this});
    }

    interval = () => {
        return setInterval(() => {

            this.queue.forEach((v) => {
                const { fn, test, _this = window } = v;

                if(test.bind(_this)() === true){
                    const result = fn.bind(_this)();
                    if(result !== false)
	                    pull(this.queue, v);
                }
            })

        }, 1000);
    }

    static get Task(){

	    return Task;
    }

}

export class Task{
    constructor(){
	    const M = (new Marshal).getInstance();
	    this.fah = M;
	    const task_name = this.constructor.name;
	    Marshal[task_name] = this;
	    Object.defineProperty(Marshal.tasks, task_name, {
		    value: Marshal[task_name],
	    });
    }

	push(testHandler, testFunction, context){
		this.fah.push(testHandler, testFunction, context);
	}
}



export default Marshal;


