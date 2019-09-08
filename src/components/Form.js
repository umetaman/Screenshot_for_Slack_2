import React, { Component } from "react";

const Config = window.nodeRequire("electron-config");
const config = new Config();
const ipcRenderer = window.nodeRequire("electron").ipcRenderer;

//アプリケーションの子Component
export default class Form extends Component {
    constructor(props) {
        super(props);
        this.state = {
            token: ""
        }
        this.handleBlur = this.handleBlur.bind(this);
        this.handleChange = this.handleChange.bind(this);
    }

    handleChange(event) {
        this.setState({
            token: event.target.value
        });
    }

    handleBlur(event) {
        this.props.handleBlur(event);
    }

    componentDidMount(){
        this.setState({
            token: config.get("token")
        });

        //Electron側に送信
        ipcRenderer.send("input-api-token", config.get("token"));
    }

    render() {
        return (
            <div className="input-token-form">
                <input
                    type="text"
                    name="token"
                    id="input_token"
                    value={this.state.token}
                    onChange={this.handleChange}
                    onBlur={this.handleBlur}
                    placeholder="Paste your Slack LegacyAPI token."
                    />
            </div>
        )
    }
}