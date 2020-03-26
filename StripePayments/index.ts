import {IInputs, IOutputs} from "./generated/ManifestTypes";
import {Stripe, StripeElements, StripeCardElement, loadStripe} from '@stripe/stripe-js';

const STATUS_NEW: string 		= "new";
const STATUS_ERROR: string 		= "error";
const STATUS_PROCESSING: string = "processing";
const STATUS_COMPLETED: string 	= "completed";

export class StripePayments3 implements ComponentFramework.StandardControl<IInputs, IOutputs> {

	private prop_amount: number;
	private prop_currency: string;
	private prop_description: string;
	private prop_ZIP_code: boolean;
	private prop_customer: string;
	private payment_status: string;
	private has_been_reset: boolean;

	private _stripe: Stripe;
	private _elements: StripeElements;
	private _card: StripeCardElement;
	private _notifyOutputChanged: () => void;

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
		this.has_been_reset = false;
		this.payment_status = STATUS_NEW;
		this._notifyOutputChanged = notifyOutputChanged;

		container.appendChild(this.getHTMLElements());

		var stripePromise = loadStripe('pk_test_cyVrfRAcAVqIn5R9NCg0qBVd0023NbM4GD'); 

		stripePromise.then( (stripe)=> {
			if(stripe){
				this._stripe = stripe;
				this._elements = stripe.elements();

				var style = {
					base: {
						color: "#32325d",
						fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
						fontSmoothing: "antialiased",
						"::placeholder": {
						  color: "#aab7c4"
						}
					  },
					  invalid: {
						color: "#fa755a",
						iconColor: "#fa755a"
					  }
					}
	
				this._card = this._elements.create("card", {
					style: style,
					hidePostalCode: !this.prop_ZIP_code });
				this._card.mount("#card-element");

				this._card.on('change', ({error}) => {
					const displayError = document.getElementById('card-errors');
					if(displayError)
							displayError.innerText = (error) ? error.message : "";						
				  });

				// Handle form submission.
				(<HTMLFormElement>document.getElementById("payment-form")!).addEventListener("submit", (event) => {
					event.preventDefault();
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
		this.prop_amount 	= context.parameters.Amount.raw || 0;
		this.prop_currency 	= context.parameters.Currency.raw || "aud";
		this.prop_description = context.parameters.Description.raw || "";
		this.prop_ZIP_code	= context.parameters.ZipcodeElement.raw || false;
		this.prop_customer	= context.parameters.Customer.raw || "";
		if(context.parameters.Reset.raw && !this.has_been_reset){
			this.setStatus(STATUS_NEW);
			this.has_been_reset = true;
			this._card.clear();
			this.reset();
		} else
			this.has_been_reset = false;
	}

	/** 
	 * It is called by the framework prior to a control receiving new data. 
	 * @returns an object based on nomenclature defined in manifest, expecting object[s] for property marked as “bound” or “output”
	 */
	public getOutputs(): IOutputs
	{
		return { PaymentStatus: this.payment_status };
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
	private pay(): void 
	{
		this.changeLoadingState(true);
		this.setStatus(STATUS_PROCESSING);

		const query_params = 
			"&amount=" + this.prop_amount * 100 + 
			"&currency=" + this.prop_currency + 
			"&description=" + encodeURI(this.prop_description.trim().substring(0, 127));

		fetch("https://stripepaymentstest.azurewebsites.net/api/CreatePaymentIntent?code=Qbj06lpwFjnTlYq6UCpHi8Uw2UrZq4eT970dSVjTQIsYcqPTL5Lhvw==" + query_params)
			.then( response => {
				if(!response.ok) 
					throw response;
				else
					return response.text();
			})
			.then(data => { 
				const intent = data; 

				// Initiate the payment.
				// If authentication is required, confirmCardPayment will automatically display a modal
				this._stripe
					.confirmCardPayment(intent, {
						payment_method: {
							card: this._card,
							billing_details: {
								name: this.prop_customer,
							},
						}
					})
					.then( (result) => {
						if (result.error) {
							// Show error to your customer
							this.setStatus(STATUS_ERROR);
							this.showError(result.error.message!);
						} else {
							// The payment has been processed!
							this.setStatus(STATUS_COMPLETED);
							this._notifyOutputChanged();
							this.orderComplete();
						}
					});
				
			})
			.catch( err => {
				err.text().then( (errorMessage: string) => {
					this.setStatus(STATUS_ERROR);
					this.showError("There was an error setting up payment: " + errorMessage);
				})
			});
	}

	private setStatus(status:string )
	{
		this.payment_status = status;
		this._notifyOutputChanged();
	}

	/* ------- Post-payment helpers ------- */

	private showError(errorMsgText: string): void {
		this.changeLoadingState(false);
		var errorMsg = document.querySelector(".sr-field-error");
		errorMsg!.textContent = errorMsgText;
		setTimeout(() => {
		errorMsg!.textContent = "";
		}, 4000);
	}

	/* Shows a success / error message when the payment is complete */
	private orderComplete() {
		document.querySelector(".sr-payment-form")!.classList.add("hidden");
		document.querySelector(".sr-result")!.classList.remove("hidden");
		this.changeLoadingState(false);
	}

	// Resets the form status to new
	private reset() {
		document.querySelector(".sr-payment-form")!.classList.remove("hidden");
		document.querySelector(".sr-result")!.classList.add("hidden");
		this.changeLoadingState(false);
	}


	// Show a spinner on payment submission
	private changeLoadingState(isLoading: boolean) {
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
}