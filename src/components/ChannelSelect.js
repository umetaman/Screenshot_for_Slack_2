import React, { Component } from "react";

//設定の保存
const Config = window.nodeRequire("electron-config");
const config = new Config();

export default class ChannelSelect extends Component {
    constructor(props) {
        super(props);
        this.state = {
            teamName: props.teamName,
            teamIcon: props.teamIcon,
            channels: props.channels
        };

        console.log(this.state);
        this.handleRadioClick = this.handleRadioClick.bind(this);
    }

    shouldComponentUpdate(){
        return true;
    }

    handleRadioClick(event) {
        let _id = event.target.value;
        this.updateChannelState(_id);
    }

    updateChannelState(newId){
        let _channels = this.state.channels.map(channel => {
            return {
                id: channel.id,
                name: channel.name,
                checked: channel.id == newId ? true : false
            }
        });

        this.setState({
            channels: _channels
        });

        config.set("id", newId);

        console.log(`ChannelSelect: ${newId}`);
    }

    render() {
        console.log("[ChannelSelect: State]");
        console.log(this.state);
        console.log("[ChannelSelect: Props]");
        console.log(this.props);

        if(this.props.teamIcon != null && this.props.teamName != null && this.props.channels.length > 1){
            return (
                <div className="channel-select-form-container">
                    <div className="team-info">
                        <img src={this.props.teamIcon} alt={this.props.teamName} />
                        <h2 className="team-name">{this.props.teamName}</h2>
                    </div>
                    <form name="channel_select_form" className="channel-select-form">
                        {
                            this.state.channels.map(channel => {
                                console.log(channel);

                                return (
                                    <label key={channel.id}>
                                        <input
                                            type="radio"
                                            name="channels"
                                            value={channel.id}
                                            checked={channel.checked}
                                            onChange={this.handleRadioClick}
                                        />
                                        {channel.name}<br />
                                    </label>
                                );
                            })
                        }
                    </form>
                </div>
            )
        }else{
            return null;
        }
    }
}