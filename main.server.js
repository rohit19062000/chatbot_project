var conversationLogDB = new Mongo.Collection("conversationLog");


//"General response" function
var stupidResponse = function(msg) {
	let Responses = [
	"I beg your pardon?", 
	"Can you be more specific?" , 
	"Oh, really?",
	"Excuse me?",
	"Is there any example?",
	"Okay, I'm listening..",
	"Huh??",
	"What are you talking about..",
	"Sorry, can you say that again?",
	"Actually, I have no idea what you are talking about..",
	"What is [" + msg + "]?",
	"What?",
	"Okay....",
	"Got i...no I don't.",
	"Are you speaking English??",
	"What do you mean specifically?"];
	let index = Math.floor(Math.random()*Responses.length);
	return Responses[index];
};


// "Weather Information" function
var weatherInfo = function(msg) {
	let wtData;
	let time = "present";
	let weatherRegex = /(weather|temperature).* in (\w+)/i;
	let tmrWtRegex = /.*(would|will|tomorrow|tmr|24|next day|forecast).*/i; //To check whether tomorrow's weather is asked
	let weatherRequest = msg.match(weatherRegex);
	let tmrWtRequest = msg.match(tmrWtRegex);
	if (tmrWtRequest != null) {
		time = "tmr";
	}
	if(weatherRequest === null) {
		return "";
	}
	else {
		let lastPos = weatherRequest.length-1;
		let cityName = weatherRequest[lastPos];
		let APIKey = "0f9acd286be670dbec09507843f8f78b";
		let wtInfoURL = 
			"http://api.openweathermap.org/data/2.5/weather?APPID="+APIKey+
			"&q="+cityName+"&units=metric";
		if (time === "tmr") {
			wtInfoURL = "https://api.openweathermap.org/data/2.5/forecast?APPID="+
						APIKey+"&q="+cityName+"&units=metric&cnt=8";
		}
		try {
			wtData = HTTP.get(wtInfoURL);
			wtData = wtData.data;
			let wtResponse;
			if (time === "present") {
				wtResponse = "It's " + wtData.weather[0].description + " in " + cityName + 
							", and currently the temperature is " + wtData.main.temp + "C.";
			}
			if (time === "tmr") {
				wtResponse = "The weather will be " + wtData.list[7].weather[0].description + 
							", and the temperature will be " + wtData.list[7].main.temp + "C.";
			}
			return wtResponse;
		}
		catch(error) {
			return "I've never heard of this city, did you spell it right?"; // changed
		}
		return "";
	}
};

//"I'm XXX" function --> Right after "ELIZA: Hi, username. How are you doing?" 
var imFine = function(msg, username) {
	let negGreetRegex = /(bad|not|don't).*/i;
	let posGreetRegex = /(well|good|nice|great).*/i;
	let sosoGreetRegex = /(soso|fine).*/i;
	let notBadGreetRegex = /not bad.*/i;
	let greetResponse = msg.match(negGreetRegex);
	let conversationNum = conversationLogDB.find({user: username}).fetch().length;
	if (conversationNum <= 4) { // To ensure that this function is only activated in the very beginning of the conversation
		if (greetResponse === null) {
			greetResponse = msg.match(posGreetRegex);
			if (greetResponse === null) {
				greetResponse = msg.match(sosoGreetRegex);
				if (greetResponse === null) {
					return "";
				}
				return "Me too.Well, let's talk about weather!" +
						" I am a weather expert. I can tell you weather of any city!";
			}
			else {
				return "Good for you, me too! Well, let's talk about weather!" +
						" I'm a weather expert. I can tell you weather of any city!";
			}
		}
		else {
			greetResponse = msg.match(notBadGreetRegex); //double negation --> positive
			if (greetResponse === null) {
				return "Me too...hey, you know what? I'm a weather expert. I can tell you the weather of any city!" +
					" Talking about weather always makes me feel better!";
			}
			else { // same response as sosoGreetRegex
				return "Me too.Well, let's talk about weather!" +
						" I am a weather expert. I can tell you weather of any city!";
			}
		}
	}
	else {
		return "";
	}
};


//This function is called right "Hello" function --> ELIZA: Hi, username. How are you doing?
var helloFunction = function(msg, username) {
	let helloRegex = /(hello|hi|hey).*/i;
	let helloResponse = msg.match(helloRegex);
	let conversationNum = conversationLogDB.find({user: username}).fetch().length;
	if (conversationNum <= 4) {
		if (helloResponse === null) {
			return "";
		}
		else {
			return "Nice to meet you! You know what? I'm a weather expert!" +
					" Give me a city name and I can tell you the weather info of that city!";
		}
	}
	else {
		return "";
	}
};


//"Doesn't want to talk about weather at the very beginning" function 
var noWtFromBegin = function(msg, username) {
	let ELIZAdb = conversationLogDB.find( //Get ELIZA's previous response
				{
					user:username,
					source:"ELIZA"
				},
				{
					sort: {time: -1}
				}
				).fetch();
	let ELIZAdbMsg = ELIZAdb[0].msg;
	let conversationNum = conversationLogDB.find({user: username}).fetch().length;
	let noWtMsgRegex = /^(?!good|nice|bad|well|great|fine|soso)(.+)|(.+)(?<!good|nice|bad|well|great|fine|soso)$/i;
	let weatherRegex = /(weather|temperature).* in (\w+)/i;
	let noMsgRegex = /(no|don't|dont).*/i;
	let noWtMsg = msg.match(noWtMsgRegex);
	let weatherRequest = msg.match(weatherRegex); //When weatherRequest = null --> This means that the user does not play with the rule
	let noMsg = msg.match(noMsgRegex);
	if (conversationNum <= 9) { 
		if (ELIZAdbMsg.includes("How are you doing?")) {
			if (noWtMsg === null) {
				return ""; 
			}
			else {
				return "Oh okay...I guess you are not in a good mood..." + 
						"I'm a weather expert. I can tell you the weather of any city!" +
						" Talking about weather might make you feel better:)"; 
			}
		}
		else {
			if (ELIZAdbMsg.includes("a weather expert")) {
				if (weatherRequest === null) {
					return "You can get weather information by asking me [What is the weather in ___?]:)";
				}
				else {
					return "";
				}
			}
			else if (ELIZAdbMsg.includes("also ask me about weather in")) {
				if (weatherRequest === null) {
					if (noMsg === null) {
						return "";
					}
					else {
						return "Okay...I understand...";
					}
				}
				else {
					return "";
				}
			}
			else {
				return "";
			}
		}
	}
	else {
		return "";
	}
	
};


// "Continue talking about weather" function
var continWtTopic = function(msg, username) {
	let ELIZAdb = conversationLogDB.find( //Get ELIZA's previous response
				{
					user:username,
					source:"ELIZA"
				},
				{
					sort: {time: -1}
				}
				).fetch();
	let ELIZAdbMsg = ELIZAdb[0].msg;
	if (ELIZAdbMsg.includes("the temperature")) {
		ELIZAdbMsg = ELIZAdb[1].msg;
		if (ELIZAdbMsg.includes("weather in other cities")) {
			return "";
		}
		else {
			return "You can also ask me about weather in other cities! Come on, give another try:)";
		}
	}
	else {
		return "";
	}

};


//"Start other topics"(The "Weather" topic has been previously talked about) function
//Place right before "stupidResponse"
var otherTopic = function(msg, username) {
	let initList = ["Hey, you know what?", "Okay, let's talk about something else!", 
					"How about talking about something more interesting..."];
	let topicList = [" I LOVE cats! Are you a cat person or a dog person?", 
					" Ahhhhh! I am SO hungry! What do you want to eat for dinner?", 
					" Make a quick guess, how old do you think I am?"];
	let initIndex = Math.floor(Math.random()*initList.length); //return a random index
	let topicIndex;
	let conversationLen = conversationLogDB.find({user: username}).fetch().length;
	let conversationDB = conversationLogDB.find( //Get ELIZA's previous response
				{
					user:username,
				},
				{
					sort: {time: -1}
				}
				).fetch();
	if (conversationLen >= 10) {
		//To see whether the topic in the topicList has been used (avoid repeated topics)
		for(let index = 0; index < conversationLen; index++) { 
			for(let topicNum = 0; topicNum < topicList.length; topicNum++) { 
				let eachTopic = topicList[topicNum];
				let eachResponse = conversationDB[index].msg;
				if(eachResponse.includes(eachTopic)) {
					topicList.splice(topicNum, 1);
				}
			}
		}
		topicIndex = Math.floor(Math.random()*topicList.length);
		return initList[initIndex] + topicList[topicIndex];
	}
	else {
		return "";
	}
};


//"I love talking about cats" function
var iLoveCat = function(msg) {
	let catRegex = /(cat|cta|atc|act|tac|tca).*/i; //Possible typos
	let dogRegex = /(dog|dgo|god|gdo|odg|ogd).*/i; //Possible typos
	let bothRegex = /both.*/i;
	let andRegex = /and.*/i;
	let neitherRegex = /(don't|neither).*/i;
	let loveCatResponse = msg.match(catRegex);
	if(loveCatResponse === null) { //The user might like only dogs or both cats and dogs(both)
		loveCatResponse = msg.match(dogRegex); //To see if the user likes dogs
		if(loveCatResponse === null) { //To see if the user likes both dogs and cats
			loveCatResponse = msg.match(bothRegex);
			if(loveCatResponse === null) {
				loveCatResponse = msg.match(neitherRegex);
				if (loveCatResponse === null) {
					return "";
				}
				else {
					return "Um...I was expecting you to choose at least one of them.";
				}
				
			}
			else {
				return "Cats are wonderful!Dogs...I just can't...";
			}
		}
		else { //If the user replies that he/she likes dogs
			return "Well...it seemed that we cannot be friend, I can't get alone with any dog person.";
		}
	}
	else {
		loveCatResponse = msg.match(andRegex);
		if (loveCatResponse === null) {
			return "Oh that's great! I actually kept 36 cats haha, I love my fluffy babies <3";
		}
		else {
			return "Cats are wonderful!Dogs...I just can't...";
		}
		
	}
};


//"Dinner" function
var dinnerFunction = function(msg, username) {
	let ELIZAdb = conversationLogDB.find( //Get ELIZA's previous response
				{
					user:username,
					source:"ELIZA"
				},
				{
					sort: {time: -1}
				}
				).fetch();
	let ELIZAdbMsg = ELIZAdb[0].msg;
	let dinnerRegex = /(eat|have|having) (\w+).*dinner.*/i;
	let dontKnowRegex = /(don't know|haven't).*/i;
	let dinnerResponse = msg.match(dinnerRegex);
	if (ELIZAdbMsg.includes("I am SO hungry")) {
		if (dinnerResponse === null) {
			dinnerResponse = msg.match(dontKnowRegex);
			if (dinnerResponse === null) {
				return msg + " sounds nice, I might consider eating that too.";
			}
			else {
				return "Umm, I always eat Mcdonald for dinner when I don't know what to eat.";
			}
		}
		else {
			let lastPos = dinnerResponse.length - 1;
			let dinner = dinnerResponse[lastPos];
			return "Sounds good! I'm gonna eat" + dinner + "for dinner too..";
		}
	}
	else {
		return "";
	}
};


//"How old do you think I am" function
var guessMyAge = function(msg, username) {
	let ELIZAdb = conversationLogDB.find( //Get ELIZA's previous response
				{
					user:username,
					source:"ELIZA"
				},
				{
					sort: {time: -1}
				}
				).fetch();
	let ELIZAdbMsg = ELIZAdb[0].msg;
	let ageRegex = /(\d+).*/i;
	let ageResponse = msg.match(ageRegex);
	if (ELIZAdbMsg.includes("how old do you think I am?")) {
		if (ageResponse === null) {
			return "";
		}
		else {
			let lastPos = ageResponse.length - 1;
			let age = ageResponse[lastPos];
			age = parseInt(age);
			if(age >= 100) {
				return "Excuse me??? Am I that OLD, dude?";
			}
			else if (age >= 60) {
				return "Well, you're not even close.";
			}
			else if (age >= 40) {
				return "Lower please.";
			}
			else if (age >= 20) {
				return "Yep. I am somewhere around this age, but I'm not gonna tell you~~";
			}
			else {
				return "Good guess. I still sound YOUNG right?";
			}
		}
	}
	else {
		return "";
	}
};


var initConversation = function(username) {
	conversationLogDB.insert(
		{
			user: username,
			source: "ELIZA",
			msg: "Hi, "+username+". How are you doing?",
			time: new Date()
		}
	);
};

conversationLogDB.deny({
	insert() {
		return true;
	},
	update() {
		return true;
	},
	remove() {
		return true;
	}
});

Meteor.publish("userConversation", function(username) {
	return conversationLogDB.find({user: username});
});



Meteor.methods({
	setUser: function(username) {
		if(username.includes(" ")) {
			throw new Meteor.Error();
		}
		else {
			let userLog = conversationLogDB.find({user: username}).fetch();
			if(userLog.length > 0) {
				return;
			}
			else {
				initConversation(username);
				return;
			}
		}
	},
	msgReceiver: function(msg, username) {
		let dataNum = conversationLogDB.find({user: username}).fetch().length;
		if(dataNum <= 20) {
			conversationLogDB.insert(
				{
					user: username,
					source: "You",
					msg: msg,
					time: new Date()
				}
			);
			let ELIZAResponse = weatherInfo(msg);
			
			if (ELIZAResponse === "") {
				ELIZAResponse = imFine(msg, username);
			}
			if (ELIZAResponse === "") {
				ELIZAResponse = helloFunction(msg, username);
			}
			if (ELIZAResponse === "") {
				ELIZAResponse = noWtFromBegin(msg, username);
			}
			if (ELIZAResponse === "") {
				ELIZAResponse = continWtTopic(msg, username);
			}
			if (ELIZAResponse === "") {
				ELIZAResponse = iLoveCat(msg);
			}
			if (ELIZAResponse === "") {
				ELIZAResponse = dinnerFunction(msg, username);
			}
			if (ELIZAResponse === "") {
				ELIZAResponse = guessMyAge(msg, username);
			}
			if(ELIZAResponse === "") {
				ELIZAResponse = otherTopic(msg, username);
			}
			
			if(ELIZAResponse === "") {
				ELIZAResponse = stupidResponse(msg);
			}
			
			conversationLogDB.insert(
				{
					user: username,
					source: "ELIZA",
					msg: ELIZAResponse,
					time: new Date()
				}
			);
			return;
		}
		else {
			return "full";
		}
	},
	resetMsg: function(username) {
		conversationLogDB.remove({user: username});
		initConversation(username);
	}
});