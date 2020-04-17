/*
Copyright 2018 New Vector Ltd
Copyright 2019 The Matrix.org Foundation C.I.C.

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

import React from 'react';
import PropTypes from 'prop-types';
import TopLeftMenu from '../views/context_menus/TopLeftMenu';
import BaseAvatar from '../views/avatars/BaseAvatar';
import {MatrixClientPeg} from '../../MatrixClientPeg';
import * as Avatar from '../../Avatar';
import { _t } from '../../languageHandler';
import dis from "../../dispatcher";
import {ContextMenu, ContextMenuButton} from "./ContextMenu";
import HeaderButton from "../views/right_panel/HeaderButton";
import * as RoomNotifs from "../../RoomNotifs";
import * as FormattingUtils from "../../utils/FormattingUtils";
import * as sdk from "../../index";

const AVATAR_SIZE = 28;

export default class TopLeftMenuButton extends React.Component {
    static propTypes = {
        collapsed: PropTypes.bool.isRequired,
    };

    static displayName = 'TopLeftMenuButton';

    constructor() {
        super();
        this.state = {
            menuDisplayed: false,
            profileInfo: null,
        };
    }

    async _getProfileInfo() {
        const cli = MatrixClientPeg.get();
        const userId = cli.getUserId();
        const profileInfo = await cli.getProfileInfo(userId);
        const avatarUrl = Avatar.avatarUrlForUser(
            {avatarUrl: profileInfo.avatar_url},
            AVATAR_SIZE, AVATAR_SIZE, "crop");

        return {
            userId,
            name: profileInfo.displayname,
            avatarUrl,
        };
    }

    async componentDidMount() {
        this._dispatcherRef = dis.register(this.onAction);

        try {
            const profileInfo = await this._getProfileInfo();
            this.setState({profileInfo});
        } catch (ex) {
            console.log("could not fetch profile");
            console.error(ex);
        }
    }

    componentWillUnmount() {
        dis.unregister(this._dispatcherRef);
    }

    onAction = (payload) => {
        // For accessibility
        if (payload.action === "toggle_top_left_menu") {
            if (this._buttonRef) this._buttonRef.click();
        }

        if (payload.action === "sync_state") {
            this.forceUpdate();
        }
    };

    _getDisplayName() {
        if (MatrixClientPeg.get().isGuest()) {
            return _t("Guest");
        } else if (this.state.profileInfo) {
            return this.state.profileInfo.name;
        } else {
            return MatrixClientPeg.get().getUserId();
        }
    }

    openMenu = (e) => {
        this._onCollapseClicked();

        // TODO: add feature toggle, and toggle when collapsed
        // e.preventDefault();
        // e.stopPropagation();
        // this.setState({ menuDisplayed: true });
    };

    closeMenu = () => {
        this.setState({
            menuDisplayed: false,
        });
    };

    _onCollapseClicked() {
        const payload = {
            action: 'toggle_menu_tab',
        };
        dis.dispatch(payload);
    }

    render() {
        const cli = MatrixClientPeg.get().getUserId();
        const AccessibleButton = sdk.getComponent('elements.AccessibleButton');

        const name = this._getDisplayName();
        let nameElement;
        let chevronElement;
        if (!this.props.collapsed) {
            // { name }
            nameElement = <div className="mx_TopLeftMenuButton_name">
                Messenger
            </div>;
            chevronElement = <span className="mx_TopLeftMenuButton_chevron" />;
        }

        const notifications = RoomNotifs.countRoomsWithNotif(MatrixClientPeg.get().getRooms());

        let badge;
        if (notifications.count) {
            badge = (
                <AccessibleButton
                    className="my_Notification_badge mx_RoomSubList_badge mx_RoomSubList_badgeHighlight"
                    onClick={this._onCollapseClicked}
                    aria-label={_t("Jump to first unread room.")}
                >
                    <div>
                        { FormattingUtils.formatCount(notifications.totalCount) }
                    </div>
                </AccessibleButton>
            );
        }

        let contextMenu;
        if (this.state.menuDisplayed) {
            const elementRect = this._buttonRef.getBoundingClientRect();

            contextMenu = (
                <ContextMenu
                    chevronFace="none"
                    left={elementRect.left}
                    top={elementRect.top + elementRect.height}
                    onFinished={this.closeMenu}
                >
                    <TopLeftMenu displayName={name} userId={cli} onFinished={this.closeMenu} />
                </ContextMenu>
            );
        }

        return <React.Fragment>

            <div className="my_HeaderContainer">
                <ContextMenuButton
                    className="mx_TopLeftMenuButton"
                    onClick={this.openMenu}
                    inputRef={(r) => this._buttonRef = r}
                    label={_t("Your profile")}
                    isExpanded={this.state.menuDisplayed}
                >
                    <BaseAvatar
                        idName={MatrixClientPeg.get().getUserId()}
                        name={name}
                        url={require("../../../res/img/chat-icon.png") }
                        width={AVATAR_SIZE}
                        height={AVATAR_SIZE}
                        resizeMethod="crop"
                    />
                    { nameElement }
                    { chevronElement }
                </ContextMenuButton>

                <div className="my_CollapseButtons" onClick={this._onCollapseClicked}>
                    <HeaderButton
                        key="collapseButton"
                        name="collapseButton"
                        isHighlighted={false}
                        onClick={function() {}}
                        title={_t('Toggle')}
                        analytics={['Left Panel', 'Collapse Button', 'click']}
                    />
                </div>
                { badge }
            </div>
            { contextMenu }
        </React.Fragment>;
    }
}
