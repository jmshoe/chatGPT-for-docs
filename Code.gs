//Load the menu in Google Docs
function onOpen(e) {
  DocumentApp.getUi().createAddonMenu()
      .addItem('Chat with Chat-GPT', 'showSidebar')
      .addToUi();
}

/**
 * Runs when the add-on is installed.
 * This method is only used by the regular add-on, and is never called by
 * the mobile add-on version.
 *
 * @param {object} e The event parameter for a simple onInstall trigger. To
 *     determine which authorization mode (ScriptApp.AuthMode) the trigger is
 *     running in, inspect e.authMode. (In practice, onInstall triggers always
 *     run in AuthMode.FULL, but onOpen triggers may be AuthMode.LIMITED or
 *     AuthMode.NONE.)
 */
function onInstall(e) {
  onOpen(e);
}

//Sidebar service
function showSidebar() {
  const ui = HtmlService.createHtmlOutputFromFile('Sidebar')
      .setTitle('Chat-GPT Options');
  DocumentApp.getUi().showSidebar(ui);
}

function getModels() {
  // Return a list of models to populate the model select box
  // return [    {value: "chat-gpt", text: "Chat-GPT"},    {value: "gpt-3", text: "GPT-3"},    {value: "davinci", text: "Davinci"}  ];
  return ["chat-gpt","gpt-3", "davinci"];

}

/**
 * Gets a list of models from the OpenAI API.
 *
 * @param {string} apiKey Your OpenAI API key.
 * @return {object[]} A list of models.
 */
function getModelsV2() {
  // Set up the options for the request
  var apiKey = "{{insert API key}}";

  var options = {
    "method": "GET",
    "headers": {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + apiKey
    }
  };
  
  // Send the request and get the response
  var response = UrlFetchApp.fetch("https://api.openai.com/v1/models", options);
  
   // Parse the response
  var data = JSON.parse(response.getContentText());
  
  // Extract the list of models from the response
  var models = data.data.map(function(model) {
    return model.id;
  });
  
  // Return the list of models
  return models;
}


function getTemperatures() {
  // Return a list of temperatures to populate the temperature select box
  return [0.1,0.2, 0.3,0.4,0.5, 0.6,0.7,0.8,0.9,1.0];

}

function getMaxTokens() {
  // Return a list of max tokens to populate the max tokens select box
  return [10,100, 250,500,1024, 2048,4096];

}


function chatGPT(myModel,myTemperature,myMaxTokens,apiKey) {
  if (apiKey) {
    PropertiesService.getUserProperties()
        .setProperty('openAPIKey', apiKey)
  }

  // Make sure a document is open
  const doc = DocumentApp.getActiveDocument();
  if (!doc) {
    return;
  }

  // Get the current selection from the document
  const selection = DocumentApp.getActiveDocument().getSelection();
  
  if (selection) {
    // Get the selected text as a string
    // var prompt = selection; Test Code
    const prompt = selection.getRangeElements()[0].getElement().asText().getText();
    
    // Send the prompt to ChatGPT and get the response
    const response = sendPromptToChatGPT(prompt, apiKey, myModel,myTemperature,myMaxTokens);
    
    Logger.log(response);

    // Insert the response text into the document
    const printResponse = response.choices[0].text;
    
    Logger.log(printResponse);

    // Insert a new paragraph after the selected text
    const selectionLength = selection.getRangeElements()[0].getElement().asText().getText().length;
    Logger.log(selectionLength);

    var body = DocumentApp.getActiveDocument().getBody();

    // Append a regular paragraph.
    body.appendParagraph(printResponse);
  }
}

/**
 * Sends a prompt to ChatGPT and returns the response.
 *
 * @param {string} prompt The prompt to send to ChatGPT.
 * @param {string} apiKey Your OpenAI API key.
 * @return {object} The API response from ChatGPT.
 */
function sendPromptToChatGPT(prompt, apiKey,myModel,myTemperature,myMaxTokens) {
  // Set up the request body
  const requestData = {
    "prompt": prompt,
    "model": myModel,
    "max_tokens": myMaxTokens,
    "temperature": myTemperature
  };
  
  // Set up the options for the request
  const options = {
    "method": "POST",
    "headers": {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + apiKey
    },
    "payload": JSON.stringify(requestData)
        //"muteHttpExceptions": true

  };
  
  // Send the request and get the response
  const response = UrlFetchApp.fetch("https://api.openai.com/v1/completions", options);
  
  // Extract the response text from the response object
  const responseText = response.getContentText();

  Logger.log(responseText);
  
  // Parse the response text as JSON
  const responseObject = JSON.parse(responseText);
  
  // Return the response from ChatGPT
  return responseObject;
// @ts-ignore

  /**
   * Saves the API key to the user's properties.
   *
   * @param {string} apiKey The API key to save.
   */
  function saveApiKey(apiKey) {
    PropertiesService.getUserProperties().setProperty("openaiApiKey", apiKey);
  }

  /**
   * Gets the API key from the user's properties.
   *
   * @return {string} The API key.
   */
  function getApiKey() {
    return PropertiesService.getUserProperties().getProperty("openaiApiKey");
  }

  function getPreferences() {
    const userProperties = PropertiesService.getUserProperties();
    return {
      openaiApiKey: userProperties.getProperty('openaiApiKey'),
    };
  }

}

