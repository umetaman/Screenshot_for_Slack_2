import React, { Component } from "react";
import './App.css';

function show(msg){
  console.log(msg);
}

class ApiForm extends React.Component{

  constructor(props){
    super(props);

    //フォームから受け取って保存する値
    this.state = {
      key: ""
    };
  }

  handleFocus = (event) => {
    console.log("Focus.");
  }

  handleChange = (event) => {
    this.setState({
      key: event.target.value
    });
  }

  handleBlur = (event) => {
    event.preventDefault();
    show("Submit: " + this.state.key);
  }

  render(){
    return(
      <div className="api-key-form">
        <label>Input your legacy API key.
          <input type="text" value={this.state.key} onChange={this.handleChange} onFocus={this.handleFocus} onBlur={this.handleBlur}/>
        </label>
      </div>
    )
  }
}

class App extends Component{
  render(){
    return(
      <div className="App">
        <h1>Slack Legacy API</h1>
        <ApiForm />
      </div>
    )
  }  
}

export default App;