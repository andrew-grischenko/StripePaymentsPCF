import {IInputs, IOutputs} from "./generated/ManifestTypes";
import {Stripe, StripeElements, StripeCardElement, loadStripe} from '@stripe/stripe-js';

const STATUS_NEW: string 		= "new";
const STATUS_ERROR: string 		= "error";
const STATUS_SUBMITTED: string = "submitted";
const STATUS_PROCESSING: string = "processing";
const STATUS_COMPLETED: string 	= "completed";

export class StripePayments3 implements ComponentFramework.StandardControl<IInputs, IOutputs> {

	private prop_ZIP_code: boolean;
	private prop_customer: string;
	private payment_status: string;
	private has_been_reset: boolean;
	private stripe_client_key: string;
	private payment_intent_client_secret: string;
	private card_font_size: number;
	private button_font_size: number;
	private error_font_size: number;
	private isAutoConfirm: boolean;
	private paymentMethodId: string;

	private _stripe?: Stripe;
	private _elements?: StripeElements;
	private _card?: StripeCardElement;
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
		this.paymentMethodId = "";
		this._notifyOutputChanged = notifyOutputChanged;
		container.appendChild(this.getHTMLElements());

		(<HTMLFormElement>document.getElementById("payment-form")!).addEventListener("submit", (event) => {
			event.preventDefault();
			this.pay();
		});
	}

	private initStripeClient()
	{
		var stripePromise = loadStripe(this.stripe_client_key); 

		stripePromise.then( (stripe)=> {
			if(stripe){
				this._stripe = stripe;
				this._elements = stripe.elements();

				this.createCardElement();

				document.querySelector("#sr-not-initialised")!.classList.add("hidden");
				document.querySelector("#payment-form")!.classList.remove("hidden");

			}
		});
	}

	private createCardElement()
	{
		if(this._elements)
		{
			this._card = this._elements.create("card", this.getCardElementOptions());
			this._card.mount("#card-element");
			this._card.on('change', ({error}) => {
				const displayError = document.getElementById('card-errors');
				if(displayError)
						displayError.innerText = (error) ? error.message : "";						
			});
		}
	}

	private getCardElementOptions(): object
	{
		return {
			style: {
				base: {
					color: "#32325d",
					fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
					fontSize: this.card_font_size + 'pt',
					fontSmoothing: "antialiased",
					"::placeholder": {
						color: "#aab7c4"
						}
					},
				invalid: {
					color: "#fa755a",
					iconColor: "#fa755a"
					}

			},
			hidePostalCode: !this.prop_ZIP_code
		}
	}

	private cleanupStripeClient()
	{
		document.querySelector("#sr-not-initialised")!.classList.remove("hidden");
		document.querySelector("#payment-form")!.classList.add("hidden");
		if(this._card)
			this._card.destroy;

		this._card = undefined;
		this._elements = undefined;
		this._stripe = undefined;
	}


	/**
	 * Called when any value in the property bag has changed. This includes field values, data-sets, global values such as container height and width, offline status, control metadata values such as label, visible, etc.
	 * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to names defined in the manifest, as well as utility functions
	 */
	public updateView(context: ComponentFramework.Context<IInputs>): void
	{
		this.prop_customer	= context.parameters.Customer.raw || "";
		this.payment_intent_client_secret = context.parameters.PaymentIntentClientSecret.raw || "";
		this.isAutoConfirm = context.parameters.AutoConfirm.raw || false;

		if(this.stripe_client_key != context.parameters.StripeClientKey.raw)
		{
			this.stripe_client_key = context.parameters.StripeClientKey.raw || "";
			this.cleanupStripeClient();

			if(!this._stripe && this.stripe_client_key)
				this.initStripeClient();

		}

		if(this.card_font_size != context.parameters.CardFontSize.raw ||
		   this.prop_ZIP_code  != context.parameters.ZipcodeElement.raw ||
		   this.error_font_size != context.parameters.ErrorFontSize.raw )
		{
			this.prop_ZIP_code	= context.parameters.ZipcodeElement.raw || false;
			this.card_font_size = context.parameters.CardFontSize.raw || 20;
			if(this._card)
				this._card.destroy();
			
			this.createCardElement();
		}

		if(this.button_font_size != context.parameters.ButtonFontSize.raw)
		{
			this.button_font_size = context.parameters.ButtonFontSize.raw || 20;
			document.documentElement.style.setProperty("--button-font-size", this.button_font_size + "pt"); 
		}

		if(this.error_font_size != context.parameters.ErrorFontSize.raw)
		{
			this.error_font_size = context.parameters.ErrorFontSize.raw || 20;
			document.documentElement.style.setProperty("--error-font-size", this.error_font_size + "pt"); 
		}

		if(context.parameters.Reset.raw && !this.has_been_reset){
			this.setStatus(STATUS_NEW);
			this.has_been_reset = true;
			if(this._card)
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
		return { 
			PaymentStatus: this.payment_status,
			PaymentMethodId: this.paymentMethodId,
		 };
	}

	/** 
	 * Called when the control is to be removed from the DOM tree. Controls should use this call for cleanup.
	 * i.e. cancelling any pending remote calls, removing listeners, etc.
	 */
	public destroy(): void
	{
		this.cleanupStripeClient();
	}

	private getHTMLElements(): DocumentFragment 
	{
		let html = `   
			<div class="sr-main">
				<div id="sr-not-initialised" class="sr-result">
					<p>The component has not been initialised: set the StripeClientKey property</p>
				</div>
				<form id="payment-form" class="sr-payment-form hidden">
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

	private validateInput():boolean {
		return true;
	}

	/*
	* Calls stripe.confirmCardPayment which creates a pop-up modal to
	* prompt the user to enter extra authentication details without leaving your page
	*/
	private pay(): void 
	{
		if(!this.validateInput())
			return;
		
		this.changeLoadingState(true);
		this.setStatus(STATUS_PROCESSING);
		
		try 
		{
			if(!this._stripe)
				if(this.stripe_client_key)
					this.initStripeClient();
				else
					throw "ERROR: No PaymentIntentClientSecret specified";

					if(	this._stripe && 
							this._card && 
							!this.isAutoConfirm &&
							this.payment_intent_client_secret)
					{
						this._stripe.confirmCardPayment(this.payment_intent_client_secret, (this.prop_customer) ? 
							{
								payment_method: {
									card: this._card,
									billing_details: {
										name: this.prop_customer
									}
								}
							} : 
							{
								payment_method: {
									card: this._card
								}
							})
							.then( (result) => {
								if (result.error) {
									// Show error to your customer
									this.setStatus(STATUS_ERROR);
									this.showError(result.error.message!);
								} else {
									// The payment has been processed!
									this.orderComplete();
									this.setStatus(STATUS_COMPLETED);
								}
							});
					} else 
					if(this._stripe && 
						this._card && 
						this.isAutoConfirm)
					{
						this._stripe.createPaymentMethod(						
						{
							type: 'card',
							card: this._card!,
							billing_details: {
								// Include any additional collected billing details.
								name: this.prop_customer ? this.prop_customer : ""
							}
						})
						.then((result)=>{
							this._elements?.submit()
							.then( () => {
								if(result.paymentMethod) {
									this.paymentMethodId = result.paymentMethod.id;
									this.detailsSubmitted();
								} else 
									throw "ERROR: No Payment method data returned from Stripe (unexpected)";
							});
						});	
					} else
						throw "ERROR: Not initialised Stripe client or empty PaymentIntentClientSecret";
		}
		catch (err: any) {
			this.setStatus(STATUS_ERROR);
			console.log(err);
			console.log(err.message);
			this.showError("The payment component has not been initialised properly. Did you set correct StripeClientKey and valid PaymentIntentClientSecret?");
		}
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

	/* Neutral state when payment details have been submitted */
	private detailsSubmitted() {
		this.setStatus(STATUS_SUBMITTED);
		document.querySelector("span#button-text")!.innerHTML = "Submitted";
		this.changeLoadingState(false);
	}

	// Resets the form status to new
	private reset() {
		document.querySelector(".sr-payment-form")!.classList.remove("hidden");
		document.querySelector(".sr-result")!.classList.add("hidden");
		document.querySelector("span#button-text")!.innerHTML = "Pay";
		this.changeLoadingState(false);
	}


	// Show a spinner on payment submission
	private changeLoadingState(isLoading: boolean) {
		if (isLoading) {
			(document.querySelector("button#submit")! as HTMLButtonElement)!.disabled = true;
			document.querySelector("#spinner")!.classList.remove("hidden");
			document.querySelector("span#button-text")!.classList.add("hidden");
		} else {
			(document.querySelector("button#submit")! as HTMLButtonElement).disabled = false;
			document.querySelector("#spinner")!.classList.add("hidden");
			document.querySelector("span#button-text")!.classList.remove("hidden");
		}
	}
}