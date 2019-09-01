import React, { Component } from "react";
import './App.css';

const electron = window.nodeRequire("electron");
const ipcRenderer = electron.ipcRenderer;

//更新用のグローバルイベント
let eventDispatcher = () => {
  console.log("This dispatcher is Null.");
};

ipcRenderer.on("receive-data", (event, data) => {
  eventDispatcher(data);
});

//アプリケーションの子Component
class Form extends Component{
  constructor(props){
    super(props);
    this.state = {
      token: ""
    }
    this.handleBlur = this.handleBlur.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }

  handleChange(event){
    this.setState({
      token: event.target.value
    });
  }

  handleBlur(event){
    this.props.handleBlur(event);
  }

  render(){
    return (
      <div className="input-token-form">
        <label>Paste your Slack Lagacy token.</label>
        <input
        type="text"
        name="token"
        id="input_token"
        value={this.state.token}
        onChange={this.handleChange}
        onBlur={this.handleBlur}/>
      </div>
    )
  }
}

class ChannelSelect extends Component{
  constructor(props){
    super(props);
    this.state = {
      channels: props.channels
    };
    this.handleRadioClick = this.handleRadioClick.bind(this);
  }

  handleRadioClick(event){
    let _id = event.target.value;
    let _channels = this.state.channels.map(channel => {
      return {
        id: channel.id,
        name: channel.name,
        checked: channel.id == _id ? true : false
      }
    });

    this.setState({
      channels: _channels
    });
  }

  render(){
    return(
      <div className="channel-select-form-container">
        <form className="channel-select-form">
          {
            this.state.channels.map(channel => {
              return(
                <label key={channel.id}>
                  <input
                  type="radio"
                  name={channel.name}
                  value={channel.id}
                  checked={channel.checked}
                  onChange={this.handleRadioClick}
                  />
                  {channel.name}<br/>
                </label>
              );
            })
          }
        </form>
      </div>
    )
  }
}

//アプリケーションの親Component
class App extends Component{
  constructor(props){
    super(props);
    this.state = {
      channels: []
    };

    this.handleUpdateList = this.handleUpdateList.bind(this);
    this.handleBlur = this.handleBlur.bind(this);
  }

  handleBlur(event){
    console.log(event.target.value);
    event.preventDefault();

    //プロセス間通信で実行する処理を定義
    eventDispatcher = (data) => {
      if(data != null){
        for(let i = 0; i < data.channels.length; i++){
          this.state.channels.push({
            id:      data.channels[i].id,
            name:    data.channels[i].name,
            checked: i == 0 ? true: false
          });
        }

        this.setState({
          channels: this.state.channels
        });
      }else{
        console.log("Received Null.");
      }
    }
    //Electron側に送信
    ipcRenderer.send("input-api-token", event.target.value);
  }

  handleUpdateList(event){
    console.log(event);
  }

  render(){
    return(
      <main id="app">
        <Form handleBlur={this.handleBlur} />
        <h1>hogehoge</h1>
        <ChannelSelect channels={this.state.channels} />
      </main>
    )
  }
}

export default App;