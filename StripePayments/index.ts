import {IInputs, IOutputs} from "./generated/ManifestTypes";
import {Stripe, StripeElements, StripeCardElement, loadStripe} from '@stripe/stripe-js';

var _stripe: Stripe;
var _elements: StripeElements;
var _card: StripeCardElement;
var _intent: string ;

export class StripePayments implements ComponentFramework.StandardControl<IInputs, IOutputs> {

	/**
	 * Empty constructor.
	 */
	constructor()
	{

	}

	/**
	 * Used to initialize the control instance. Controls can kick off remote server calls and other initialization actions here.
	 * Data-set values are not initialized here, use updateView.
	 * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to property names defined in the manifest, as well as utility functions.
	 * @param notifyOutputChanged A callback method to alert the framework that the control has new outputs ready to be retrieved asynchronously.
	 * @param state A piece of data that persists in one session for a single user. Can be set at any point in a controls life cycle by calling 'setControlState' in the Mode interface.
	 * @param container If a control is marked control-type='standard', it will receive an empty div element within which it can render its content.
	 */
	public init(context: ComponentFramework.Context<IInputs>, notifyOutputChanged: () => void, state: ComponentFramework.Dictionary, container:HTMLDivElement)
	{

		container.appendChild(this.getHTMLElements());
		
		// Disable the button until we have Stripe set up on the page
		document.querySelector("button")!.disabled = true;

		fetch("https://stripepaymentstest.azurewebsites.net/api/GetClientSecret?code=mH88UawpzidyR/MRtaOPeHe/feddsl5ReH0SEUkiiQLgaegOU4RfIw==")
			.then(response => response.text())
			.then(data => { 
				_intent = data; 
				console.log("Client secret received: " + _intent);

				document.querySelector("button")!.disabled = false;
			});

		var stripePromise = loadStripe('pk_test_cyVrfRAcAVqIn5R9NCg0qBVd0023NbM4GD'); 

		stripePromise.then( (stripe)=> {
			if(stripe){
				_stripe = stripe;
				_elements = stripe.elements();

				var style = {
					base: {
						color: "#32325d",
						fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
						fontSmoothing: "antialiased",
						fontSize: "16px",
						"::placeholder": {
						  color: "#aab7c4"
						}
					  },
					  invalid: {
						color: "#fa755a",
						iconColor: "#fa755a"
					  }
					}
	
				_card = _elements.create("card", {style: style });
				_card.mount("#card-element");

				_card.on('change', ({error}) => {
					const displayError = document.getElementById('card-errors');
					if(displayError)
							displayError.innerText = (error) ? error.message : "";						
				  });

				// Handle form submission.
				(<HTMLFormElement>document.getElementById("payment-form")!).addEventListener("submit", (event) => {
					event.preventDefault();
					// Initiate payment when the submit button is clicked
					this.pay();
					});
			}
		});

	}


	/**
	 * Called when any value in the property bag has changed. This includes field values, data-sets, global values such as container height and width, offline status, control metadata values such as label, visible, etc.
	 * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to names defined in the manifest, as well as utility functions
	 */
	public updateView(context: ComponentFramework.Context<IInputs>): void
	{
		// Add code to update control view
	}

	/** 
	 * It is called by the framework prior to a control receiving new data. 
	 * @returns an object based on nomenclature defined in manifest, expecting object[s] for property marked as “bound” or “output”
	 */
	public getOutputs(): IOutputs
	{
		return {};
	}

	/** 
	 * Called when the control is to be removed from the DOM tree. Controls should use this call for cleanup.
	 * i.e. cancelling any pending remote calls, removing listeners, etc.
	 */
	public destroy(): void
	{
		// Add code to cleanup control if necessary
	}

	private getHTMLElements(): DocumentFragment 
	{
		let html = `   
			<div class="sr-main">
				<form id="payment-form" class="sr-payment-form">
					<div class="sr-combo-inputs-row">
						<div class="sr-input sr-card-element" id="card-element"></div>
					</div>
					<div class="sr-field-error" id="card-errors" role="alert"></div>
					<button id="submit">
						<div class="spinner hidden" id="spinner"></div>
						<span id="button-text">Pay</span>
						<span id="order-amount"></span>
					</button>
				</form>
				<div class="sr-result hidden">
					<p>Payment completed<br /></p>
					<pre>
						<code></code>
					</pre>
				</div>
			</div>`;
		var template = document.createElement('template');
		html = html.trim(); // Never return a text node of whitespace as the result
		template.innerHTML = html;
		return template.content;
	}




	/*
	* Calls stripe.confirmCardPayment which creates a pop-up modal to
	* prompt the user to enter extra authentication details without leaving your page
	*/
	private pay(): void {
	changeLoadingState(true);

	// Initiate the payment.
	// If authentication is required, confirmCardPayment will automatically display a modal
	_stripe
		.confirmCardPayment(_intent, {
		payment_method: {
			card: _card
		}
		})
		.then( (result) => {
		if (result.error) {
			// Show error to your customer
			showError(result.error.message!);
		} else {
			// The payment has been processed!
			orderComplete(_intent);
		}
		});
	};
}

/* ------- Post-payment helpers ------- */

function showError(errorMsgText: string): void {
	changeLoadingState(false);
	var errorMsg = document.querySelector(".sr-field-error");
	errorMsg!.textContent = errorMsgText;
	setTimeout(() => {
	  errorMsg!.textContent = "";
	}, 4000);
}

/* Shows a success / error message when the payment is complete */
function orderComplete(clientSecret: string) {
  // Just for the purpose of the sample, show the PaymentIntent response object
  _stripe.retrievePaymentIntent(clientSecret).then(function(result) {
    var paymentIntent = result.paymentIntent;
    var paymentIntentJson = JSON.stringify(paymentIntent, null, 2);

    document.querySelector(".sr-payment-form")!.classList.add("hidden");
    document.querySelector("pre")!.textContent = paymentIntentJson;

    document.querySelector(".sr-result")!.classList.remove("hidden");
    setTimeout(function() {
      document.querySelector(".sr-result")!.classList.add("expand");
    }, 200);

    changeLoadingState(false);
  });
}

// Show a spinner on payment submission
function changeLoadingState(isLoading: boolean) {
	if (isLoading) {
		document.querySelector("button")!.disabled = true;
		document.querySelector("#spinner")!.classList.remove("hidden");
		document.querySelector("#button-text")!.classList.add("hidden");
	} else {
		document.querySelector("button")!.disabled = false;
		document.querySelector("#spinner")!.classList.add("hidden");
		document.querySelector("#button-text")!.classList.remove("hidden");
	}
}