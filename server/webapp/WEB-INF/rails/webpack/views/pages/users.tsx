/*
* Copyright 2018 ThoughtWorks, Inc.
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*     http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/

import * as m from "mithril";
import {Stream} from "mithril/stream";
import * as stream from "mithril/stream";
import {RolesCRUD} from "models/roles/roles_crud";
import {Roles} from "models/roles/roles_new";
import {UserFilters} from "models/users/user_filters";
import {BulkUserOperationJSON, BulkUserUpdateJSON, UserJSON, Users} from "models/users/users";
import {UsersCRUD} from "models/users/users_crud";
import * as Buttons from "views/components/buttons";
import {FlashMessage, MessageType} from "views/components/flash_message";
import {HeaderPanel} from "views/components/header_panel";
import {Page, PageState} from "views/pages/page";
import {AddOperation, DeleteOperation, DisableOperation, EnableOperation} from "views/pages/page_operations";
import {UserSearchModal} from "views/pages/users/add_user_modal";
import {Attrs, UsersWidget} from "views/pages/users/users_widget";

interface State extends AddOperation<UserJSON>, EnableOperation<Users>, DisableOperation<Users>, DeleteOperation<Users>, Attrs {
  initialUsers: Stream<Users>;
}

export class UsersPage extends Page<null, State> {
  oninit(vnode: m.Vnode<null, State>) {
    super.oninit(vnode);

    vnode.state.initialUsers = stream(new Users());
    vnode.state.userFilter   = stream(new UserFilters());
    vnode.state.roles        = stream(new Roles());

    vnode.state.onAdd = (e) => {
      e.stopPropagation();
      new UserSearchModal(this.flashMessage, this.fetchData.bind(this, vnode)).render();
    };

    vnode.state.onEnable = (usersToEnable, e) => {
      const json = {
        operations: {
          enable: true,
        },
        users: usersToEnable.userNamesOfSelectedUsers()
      };

      this.bulkUserStateChange(vnode, json);
    };

    vnode.state.onDisable = (usersToDisable, e) => {
      const json = {
        operations: {
          enable: false,
        },
        users: usersToDisable.userNamesOfSelectedUsers()
      };

      this.bulkUserStateChange(vnode, json);
    };

    vnode.state.onDelete = (usersToDelete, e) => {
      const json = {
        users: usersToDelete.userNamesOfSelectedUsers()
      };

      this.bulkUserDelete(vnode, json);
    };

    vnode.state.users = () => vnode.state.userFilter().performFilteringOn(vnode.state.initialUsers());
  }

  componentToDisplay(vnode: m.Vnode<null, State>): JSX.Element | undefined {
    return (
      <div>
        <FlashMessage type={this.flashMessage.type} message={this.flashMessage.message}/>
        <UsersWidget {...vnode.state} />
      </div>
    );
  }

  pageName(): string {
    return "User summary";
  }

  headerPanel(vnode: m.Vnode<null, State>) {
    const headerButtons = [];
    headerButtons.push(<Buttons.Primary onclick={vnode.state.onAdd.bind(vnode.state)}>Add User</Buttons.Primary>);

    return <HeaderPanel title="Users Management" buttons={headerButtons}/>;
  }

  fetchData(vnode: m.Vnode<null, State>): Promise<any> {
    return Promise.all([UsersCRUD.all(), RolesCRUD.all('gocd')]).then((args) => {
      const userResult  = args[0];
      const rolesResult = args[1];

      userResult.do((successResponse) => {
                      vnode.state.initialUsers(successResponse.body);
                      this.pageState = PageState.OK;
                    }, (errorResponse) => {
                      // vnode.state.onError(errorResponse.message);
                      this.pageState = PageState.FAILED;
                    }
      );

      rolesResult.do((successResponse) => {
                       vnode.state.roles(successResponse.body);
                       this.pageState = PageState.OK;
                     }, (errorResponse) => {
                       // vnode.state.onError(errorResponse.message);
                       this.pageState = PageState.FAILED;
                     }
      );
    });
  }

  bulkUserStateChange(vnode: m.Vnode<null, State>, json: BulkUserUpdateJSON): void {
    UsersCRUD.bulkUserStateUpdate(json)
             .then((apiResult) => {
               apiResult.do((successResponse) => {
                 this.pageState = PageState.OK;
                 this.flashMessage.setMessage(MessageType.success,
                                              `Users were ${json.operations.enable ? "enabled" : "disabled"} successfully!`);
                 this.fetchData(vnode);
               }, (errorResponse) => {
                 // vnode.state.onError(errorResponse.message);
                 this.flashMessage.setMessage(MessageType.alert, errorResponse.message);
                 this.fetchData(vnode);
               });
             });
  }

  private bulkUserDelete(vnode: m.Vnode<null, State>, json: BulkUserOperationJSON): void {
    UsersCRUD.bulkUserDelete(json)
             .then((apiResult) => {
               apiResult.do((successResponse) => {
                 this.pageState = PageState.OK;
                 this.flashMessage.setMessage(MessageType.success, "Users were deleted successfully!");
                 this.fetchData(vnode);
               }, (errorResponse) => {
                 // vnode.state.onError(errorResponse.message);
                 this.flashMessage.setMessage(MessageType.alert, errorResponse.message);
                 this.fetchData(vnode);
               });
             });
  }
}
