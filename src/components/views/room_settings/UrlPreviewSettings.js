/*
Copyright 2016 OpenMarket Ltd

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import Promise from 'bluebird';
const React = require('react');
const MatrixClientPeg = require('../../../MatrixClientPeg');
const sdk = require("../../../index");
const Modal = require("../../../Modal");
const UserSettingsStore = require('../../../UserSettingsStore');
import { _t, _tJsx } from '../../../languageHandler';


module.exports = React.createClass({
    displayName: 'UrlPreviewSettings',

    propTypes: {
        room: React.PropTypes.object,
    },

    getInitialState: function() {
        const cli = MatrixClientPeg.get();
        const roomState = this.props.room.currentState;

        const roomPreviewUrls = this.props.room.currentState.getStateEvents('org.matrix.room.preview_urls', '');
        const userPreviewUrls = this.props.room.getAccountData("org.matrix.room.preview_urls");

        return {
            globalDisableUrlPreview: (roomPreviewUrls && roomPreviewUrls.getContent().disable) || false,
            userDisableUrlPreview: (userPreviewUrls && (userPreviewUrls.getContent().disable === true)) || false,
            userEnableUrlPreview: (userPreviewUrls && (userPreviewUrls.getContent().disable === false)) || false,
        };
    },

    componentDidMount: function() {
        this.originalState = Object.assign({}, this.state);
    },

    saveSettings: function() {
        const promises = [];

        if (this.state.globalDisableUrlPreview !== this.originalState.globalDisableUrlPreview) {
            console.log("UrlPreviewSettings: Updating room's preview_urls state event");
            promises.push(
                MatrixClientPeg.get().sendStateEvent(
                    this.props.room.roomId, "org.matrix.room.preview_urls", {
                        disable: this.state.globalDisableUrlPreview,
                    }, "",
                ),
            );
        }

        let content = undefined;
        if (this.state.userDisableUrlPreview !== this.originalState.userDisableUrlPreview) {
            console.log("UrlPreviewSettings: Disabling user's per-room preview_urls");
            content = this.state.userDisableUrlPreview ? { disable: true } : {};
        }

        if (this.state.userEnableUrlPreview !== this.originalState.userEnableUrlPreview) {
            console.log("UrlPreviewSettings: Enabling user's per-room preview_urls");
            if (!content || content.disable === undefined) {
                content = this.state.userEnableUrlPreview ? { disable: false } : {};
            }
        }

        if (content) {
            promises.push(
                MatrixClientPeg.get().setRoomAccountData(
                    this.props.room.roomId, "org.matrix.room.preview_urls", content,
                ),
            );
        }

        console.log("UrlPreviewSettings: saveSettings: " + JSON.stringify(promises));

        return promises;
    },

    onGlobalDisableUrlPreviewChange: function() {
        this.setState({
            globalDisableUrlPreview: this.refs.globalDisableUrlPreview.checked ? true : false,
        });
    },

    onUserEnableUrlPreviewChange: function() {
        this.setState({
            userDisableUrlPreview: false,
            userEnableUrlPreview: this.refs.userEnableUrlPreview.checked ? true : false,
        });
    },

    onUserDisableUrlPreviewChange: function() {
        this.setState({
            userDisableUrlPreview: this.refs.userDisableUrlPreview.checked ? true : false,
            userEnableUrlPreview: false,
        });
    },

    render: function() {
        const self = this;
        const roomState = this.props.room.currentState;
        const cli = MatrixClientPeg.get();

        const maySetRoomPreviewUrls = roomState.mayClientSendStateEvent('org.matrix.room.preview_urls', cli);
        let disableRoomPreviewUrls;
        if (maySetRoomPreviewUrls) {
            disableRoomPreviewUrls =
                <label>
                    <input type="checkbox" ref="globalDisableUrlPreview"
                           onChange={this.onGlobalDisableUrlPreviewChange}
                           checked={this.state.globalDisableUrlPreview} />
                    { _t("Disable URL previews by default for participants in this room") }
                </label>;
        } else {
            disableRoomPreviewUrls =
                <label>
                    { _t("URL previews are %(globalDisableUrlPreview)s by default for participants in this room.", {globalDisableUrlPreview: this.state.globalDisableUrlPreview ? _t("disabled") : _t("enabled")}) }
                </label>;
        }

        let urlPreviewText = null;
        if (UserSettingsStore.getUrlPreviewsDisabled()) {
            urlPreviewText = (
                _tJsx("You have <a>disabled</a> URL previews by default.", /<a>(.*?)<\/a>/, (sub)=><a href="#/settings">{ sub }</a>)
            );
        } else {
            urlPreviewText = (
                _tJsx("You have <a>enabled</a> URL previews by default.", /<a>(.*?)<\/a>/, (sub)=><a href="#/settings">{ sub }</a>)
            );
        }

        return (
            <div className="mx_RoomSettings_toggles">
                <h3>{ _t("URL Previews") }</h3>

                <label>
                { urlPreviewText }
                </label>
                { disableRoomPreviewUrls }
                <label>
                    <input type="checkbox" ref="userEnableUrlPreview"
                           onChange={this.onUserEnableUrlPreviewChange}
                           checked={this.state.userEnableUrlPreview} />
                    { _t("Enable URL previews for this room (affects only you)") }
                </label>
                <label>
                    <input type="checkbox" ref="userDisableUrlPreview"
                           onChange={this.onUserDisableUrlPreviewChange}
                           checked={this.state.userDisableUrlPreview} />
                    { _t("Disable URL previews for this room (affects only you)") }
                </label>
            </div>
        );
    },
});
