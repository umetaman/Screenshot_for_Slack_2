import React, { Component } from "react";
import '../App.css';
import Form from './Form';
import ChannelSelect from './ChannelSelect';

const electron = window.nodeRequire("electron");
const ipcRenderer = electron.ipcRenderer;
const Config = window.nodeRequire("electron-config");
const config = new Config();

//更新用のグローバルイベント
let eventDispatcher = () => {
  console.log("This dispatcher is Null.");
};

ipcRenderer.on("receive-data", (event, data) => {
  eventDispatcher(data);
});

//アプリケーションの親Component
class App extends Component{
  constructor(props){
    super(props);

    this.state = {
      teamName: "",
      teamIcon: "",
      channels: []
    };

    this.handleBlur = this.handleBlur.bind(this);
  }

  handleBlur(event){
    console.log(event.target.value);
    event.preventDefault();
    
    //Electron側に送信
    ipcRenderer.send("input-api-token", event.target.value);
  }

  componentWillMount(){
    //プロセス間通信で実行する処理を定義
    eventDispatcher = (data) => {
      if(data != null){
        //配列の初期化
        this.state.channels.length = 0;
        
        //チャンネルリスト
        //末尾から調べて、一致しなかったら先頭にチェックを入れる
        const savedId = config.get("id");
        for(let i = data.channels.length - 1; i >= 0; i--){
          
          let channel = data.channels[i];

          this.state.channels.unshift({
            id: channel.id,
            name: channel.name,
            checked: i == 0 || savedId == channel.id ? true : false
          });
        }
        
        this.setState({
          teamName: data.teamName,
          teamIcon: data.teamIcon,
          channels: this.state.channels
        });

        console.log(this.state);
      }else{
        console.log("Received Null.");
      }
    }

    console.log("App.js: channelDidMount");
  }

  render(){
    return(
      <main id="app">
        <Form handleBlur={this.handleBlur} />
        <ChannelSelect
        teamName={this.state.teamName}
        teamIcon={this.state.teamIcon}
        channels={this.state.channels} />
      </main>
    )
  }
}

export default App;