/*
 * Copyright (c) 2025 OopsClick LLC. All rights reserved.
 * This work is licensed under the O'Saasy License Agreement, a copy of which can be
 * found in the LICENSE file in the root directory of this project or at https://silkbuilder.com/core-license.
 */

/** 
 * Returns a Pulse instance.
 * @class
 * @classdesc The Pulse Class is only use for internal purposes.
 */
var Pulse = function(pulseURL, logoutURL){
	this.initTime = new Date();
	this.active = true;
	this.debug = false;

	var dialogOpen = false;
	var pageTitle = document.title;
	var blink = 0;
	
	var pulseTime = 60000; // 120000 = 2 min, 60000 = 1 min
	var pulseInterval;
	var allowedIdle = 15; //minutes

	/*
	 * Returns a list of the used URLs.
	 */
	this.getURL = function(){
		return pulseURL+" "+logoutURL;
	}
	
	/*
	 * Resets the timer.
	 * This is called when the mouse is moved and/or when a key is press.
	 */
	this.reset = function(){
		if( this.debug ) console.log("reset");
		this.initTime = new Date();
		localStorage.setItem("__pulseInitTime",this.initTime.getTime());
		document.title = pageTitle;
	}
	
	/*
	 * Restats the timer operations.
	 */
	this.restart = function(){
		this.active = true;
		dialogOpen = false;
		this.reset();
	}
	
	/*
	 * Used for testing purposes. It set the timeout to 14 minutes of inactivity.
	 */ 
	this.testTimeout = function(){
		let newTime = new Date();
		localStorage.setItem("__pulseInitTime",newTime.getTime()-840000);
	}	

	/*
	 * Checks if the timeout is over and conects to the server to check if the sesssion has ended.
	 * If the timer is over the allocated time the dialog is open.
	 */	
	this.beat = function(){
		
		const storageTime = localStorage.getItem("__pulseInitTime");
		if( storageTime==null ){
			this.initTime = new Date();
		}else{
			this.initTime = new Date( getNumber(storageTime) );
		}

		var currentTime = new Date();
		var timeDiff = (currentTime-this.initTime);
		var idleMinutes = Math.round(((timeDiff % 86400000) % 3600000) / 60000);
		
		var mode = "beat";
		if( this.active ){
			if( idleMinutes > allowedIdle ){
				this.active = false;
				this.openDialog();
			}else{
				if( this.debug ) console.log("idle:"+idleMinutes+" min.");
				if( idleMinutes<1 ){
					document.title = pageTitle;
				}else{
					document.title = "⏰"+idleMinutes+"m. "+pageTitle;
				}
			}
		}
		
		/*
		 * If dialog is open after 2.5 m in it closes the page.
		 * This is to compensate when page is in a hidden tab and setTimeout gets slow.
		 */
		if( dialogOpen ) {
			if( idleMinutes > allowedIdle+160000 ){
				mode="disable";
				//this.close();
			}
		}
		/*
		 * Call the pulseURL service to refresh the seesion time in the database.
		 * If the service returns a value different than "0" the page is closed.
		 * If the service return an error message the page is closed.
		 */
		$.ajax({
			context: this,
			url: pulseURL,
			data: {
				mode: mode,
			},
			type: 'POST',
			error: function() {
				if( this.debug ) console.log('<p>An error has occurred</p>');
				/*
				 * If internet is not detected is shows a message.
				 */
				if( !navigator.onLine ){
					silk.alert("No Internet Detected","Check your internet connectivity before continuing using the application.","error");
					return;
				}
				this.close();
			},
			dataType: 'text',
			success: function(data) {
				if( this.debug ) console.log("beat:"+data+" - "+mode);
				if( data!="0" ) this.close();
			}
		});

	}

	/*
	 * Leaves page and open open the loutURL service.
	 */
	this.close = function(){
		window.location.href = logoutURL;
	}
	
	/*
	 * Opens the dialog asking for session renewal.
	 */
	this.openDialog = function () {
		dialogOpen = true;
		let timerInterval;
		blink==0
		silk.alert({
			icon: "warning",
			title: "Inactivity Warning",
			html: "The Application will close in <b>2:00</b> minutes.",
			confirmButtonText: "Continue Working",
			timer: 120000,
			allowOutsideClick: false,
			timerProgressBar: true,
			didOpen: function() {
				//Swal.showLoading(Swal.getDenyButton());
				const b = Swal.getHtmlContainer().querySelector('b');
				timerInterval = setInterval(function(){
					var timeLeft = Swal.getTimerLeft();
					var minutes = Math.floor(timeLeft / 60000);
					var seconds = ((timeLeft % 60000) / 1000).toFixed(0);
					var timeString = seconds == 60 ? (minutes+1) + ":00" : minutes + ":" + (seconds < 10 ? "0" : "") + seconds
					b.textContent = timeString;
					if( blink==0 ){
						document.title = "🔴 "+pageTitle;
						blink=1; 
					}else{
						document.title = "🟣️ "+pageTitle;
						blink=0; 
					}
				}, 1000)
			},
			willClose: function(){
				clearInterval(timerInterval);
			}
		}).then(function(result){
			if (result.dismiss === Swal.DismissReason.timer) {
				self.close();
			}else{
				self.restart();
			}
		});
	}
	
	/*
	 * Initializes the Pulse object.
	 */
	this.initPulse = function(){
		if( this.debug ) console.log("started")
		this.reset();
	}

	var self=this;
		
};
