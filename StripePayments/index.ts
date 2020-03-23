import {IInputs, IOutputs} from "./generated/ManifestTypes";
import {Stripe, StripeElements, StripeCardElement, loadStripe} from '@stripe/stripe-js';

var _stripe: Stripe;
var _elements: StripeElements;
var _card: StripeCardElement;
var _intent: string ;

export class StripePayments implements ComponentFramework.StandardControl<IInputs, IOutputs> {

	// reference to the component container HTMLDivElement
	// This element contains all elements of our code component example
	private _container: HTMLDivElement;
	// reference to Power Apps component framework Context object

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
		var stripePromise = loadStripe('pk_test_cyVrfRAcAVqIn5R9NCg0qBVd0023NbM4GD'); 

		fetch("https://stripepaymentstest.azurewebsites.net/api/GetClientSecret?code=mH88UawpzidyR/MRtaOPeHe/feddsl5ReH0SEUkiiQLgaegOU4RfIw==")
			.then(response => response.text())
			.then(data => { 
				_intent = data; 
				console.log("Client secret received: " + _intent);
			});

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
							color: "#aab7c4",
						  },
						},
						invalid: {
						  color: "#fa755a",
						  iconColor: "#fa755a",
						},
					}
	
				_card = _elements.create("card", {style: style });
				_card.mount("#card-element");

				_card.on('change', ({error}) => {
					const displayError = document.getElementById('card-errors');
					if(displayError)
							displayError.innerText = (error) ? error.message : "";						
				  });
			}
		});
		
		this._container = document.createElement("div");
		var scriptElement: HTMLElement = document.createElement("script");
		scriptElement.setAttribute("src", "https://js.stripe.com/v3/");
		this._container.appendChild(scriptElement);

		/*var script2Element: HTMLElement = document.createElement("script");
		script2Element.innerHTML = "var stripe = Stripe('pk_test_cyVrfRAcAVqIn5R9NCg0qBVd0023NbM4GD'); var elements = stripe.elements();";
		this._container.appendChild(script2Element);*/

		var formElement: HTMLElement = document.createElement("form");
		formElement.setAttribute("id", "payment-form");

		var cardDivElement: HTMLElement = document.createElement("div");
		cardDivElement.setAttribute("id", "card-element");
		formElement.appendChild(cardDivElement);

		var errorDivElement: HTMLElement = document.createElement("div");
		errorDivElement.setAttribute("id", "card-errors");
		errorDivElement.setAttribute("role", "alert");
		formElement.appendChild(errorDivElement);	
		
		var submitElement: HTMLElement = document.createElement("button");
		submitElement.setAttribute("id", "submit");
		submitElement.innerText = "Pay";
		formElement.appendChild(submitElement);	

		this._container.appendChild(formElement);
		container.appendChild(this._container);

		formElement.addEventListener('submit', function(ev) {
			if(_stripe){
				ev.preventDefault();
				_stripe.confirmCardPayment(_intent, {
				payment_method: {
					card: _card,
					billing_details: {
						name: 'Jenny Rosen'
					}
				}
				}).then(function(result: any) {
				if (result && result.error) {
					// Show error to your customer (e.g., insufficient funds)
					console.log(result.error.message);
				} else {
					// The payment has been processed!
					if (result && result.paymentIntent.status === 'succeeded') {
						console.log("SUCCESSFUL PAYMENT!");
					// Show a success message to your customer
					// There's a risk of the customer closing the window before callback
					// execution. Set up a webhook or plugin to listen for the
					// payment_intent.succeeded event that handles any business critical
					// post-payment actions.
					}
				}
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
}