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

import {bind} from "classnames/bind";
import {MithrilViewComponent} from "jsx/mithril-component";
import * as _ from "lodash";
import * as m from "mithril";
import * as s from "underscore.string";
import * as uuid from "uuid/v4";
import * as Buttons from "views/components/buttons";
import {EncryptedValue} from "views/components/forms/encrypted_value";
import {SwitchBtn} from "views/components/switch";
import * as styles from "./forms.scss";

const classnames = bind(styles);

export interface LabelAttrs<T> {
  label?: string;
  errorText?: string;
  helpText?: string;
  onchange?: (evt: any) => void;
  disabled?: boolean;
  required?: boolean;
  small?: boolean;
  placeholder?: string;
  property: (newValue?: T) => T;
  dataTestId?: string;
}

type FormFieldAttrs<T> = LabelAttrs<T>;

abstract class FormField<T> extends MithrilViewComponent<FormFieldAttrs<T>> {
  protected readonly id: string         = `input-${uuid()}`;
  protected readonly helpTextId: string = `${this.id}-help-text`;
  protected readonly errorId: string    = `${this.id}-error-text`;

  view(vnode: m.Vnode<FormFieldAttrs<T>>) {

    return (
      <li className={classnames(styles.formGroup, {[styles.formHasError]: this.hasErrorText(vnode)})}>
        {this.renderLabel(vnode)}
        {this.renderInputField(vnode)}
        {this.errorSpan(vnode)}
        {this.getHelpSpan(vnode)}
      </li>
    );
  }

  abstract renderInputField(vnode: m.Vnode<FormFieldAttrs<T>>): m.Children | null | void;

  protected defaultAttributes(vnode: m.Vnode<FormFieldAttrs<T>>): { [key: string]: any } {
    const required = this.isRequiredField(vnode);

    const defaultAttrs: { [key: string]: string | boolean } = {
      readonly: !!vnode.attrs.disabled,
      required: !!required,
      autocomplete: "off",
      autocapitalize: "off",
      autocorrect: "off",
      spellcheck: false,
      id: this.id,
      placeholder: vnode.attrs.placeholder || "",
    };

    if (this.hasLabelText(vnode)) {
      defaultAttrs["aria-label"]   = vnode.attrs.label as string;
      defaultAttrs["data-test-id"] = `form-field-input-${s.slugify(vnode.attrs.label as string)}`;
    }

    if (this.hasDataTestId(vnode)) {
      defaultAttrs["data-test-id"] = vnode.attrs.dataTestId as string;
    }

    if (this.hasHelpText(vnode)) {
      defaultAttrs["aria-describedby"] = this.helpTextId;
    }

    if (this.hasErrorText(vnode)) {
      defaultAttrs["aria-errormessage"] = this.errorId;
    }

    if (required) {
      defaultAttrs["aria-required"] = true;
      defaultAttrs.required         = true;
    }

    return defaultAttrs;
  }

  // moved
  protected getHelpSpan(vnode: m.Vnode<FormFieldAttrs<T>>) {
    if (this.hasHelpText(vnode)) {
      return (<span id={this.helpTextId} className={classnames(styles.formHelp)}>{vnode.attrs.helpText}</span>);
    }
  }

  protected hasHelpText(vnode: m.Vnode<FormFieldAttrs<T>>) {
    return !_.isEmpty(vnode.attrs.helpText);
  }

  protected hasDataTestId(vnode: m.Vnode<FormFieldAttrs<T>>) {
    return !_.isEmpty(vnode.attrs.dataTestId);
  }

  protected hasLabelText(vnode: m.Vnode<FormFieldAttrs<T>>) {
    return !_.isEmpty(vnode.attrs.label);
  }

  protected hasErrorText(vnode: m.Vnode<FormFieldAttrs<T>>) {
    return !_.isEmpty(vnode.attrs.errorText);
  }

  protected isRequiredField(vnode: m.Vnode<FormFieldAttrs<T>>) {
    return vnode.attrs.required;
  }

  protected errorSpan(vnode: m.Vnode<FormFieldAttrs<T>>) {
    if (this.hasErrorText(vnode)) {
      return (
        <span className={styles.formErrorText} id={this.errorId}>{vnode.attrs.errorText}</span>
      );
    }
  }

  protected bindingAttributes(vnode: m.Vnode<FormFieldAttrs<T>>,
                              eventName: string,
                              propertyAttribute: string): { [key: string]: any } {
    return {
      [eventName]: (evt: any) => {
        vnode.attrs.property(evt.currentTarget[propertyAttribute]);
        if (vnode.attrs.onchange) {
          vnode.attrs.onchange(evt);
        }
      },
      [propertyAttribute]: vnode.attrs.property()
    };
  }

  protected renderLabel(vnode: m.Vnode<FormFieldAttrs<T>>) {
    if (this.hasLabelText(vnode)) {
      const maybeRequired = this.isRequiredField(vnode) ?
        <span className={styles.formLabelRequired}>*</span> : undefined;

      return <label for={this.id} className={this.labelClass()}
                    data-test-id={`form-field-label-${s.slugify(vnode.attrs.label as string)}`}>{vnode.attrs.label}{maybeRequired}</label>;
    }
  }

  protected labelClass() {
    return styles.formLabel;
  }
}

export class TextField extends FormField<string> {
  renderInputField(vnode: m.Vnode<FormFieldAttrs<string>>) {
    return (
      <input type="text"
             {...this.defaultAttributes(vnode)}
             {...this.bindingAttributes(vnode, "oninput", "value")}
             className={classnames(styles.formControl)}/>
    );
  }
}

export class SearchField extends FormField<string> {

  view(vnode: m.Vnode<FormFieldAttrs<string>>): any {
    return this.renderInputField(vnode);
  }

  renderInputField(vnode: m.Vnode<FormFieldAttrs<string>>) {
    return (
      <span className={classnames(styles.searchBoxWrapper)}>
      <input type="search"
             {...this.defaultAttributes(vnode)}
             {...this.bindingAttributes(vnode, "oninput", "value")}
             className={classnames(styles.formControl, styles.searchBoxInput)}/>
      </span>
    );
  }
}

interface FormResetButtonAttrs {
  onclick?: (e: MouseEvent) => void;
}

class FormResetButton extends MithrilViewComponent<FormResetButtonAttrs> {

  view(vnode: m.Vnode<FormResetButtonAttrs>): any {
    return <div class={styles.formInputReset}>
      <Buttons.Reset small={true} onclick={vnode.attrs.onclick}>{vnode.children}</Buttons.Reset>
    </div>;
  }
}

export class PasswordField extends FormField<EncryptedValue> {
  renderInputField(vnode: m.Vnode<FormFieldAttrs<EncryptedValue>>) {
    const input = <input type="password"
                         {...this.defaultAttributes(vnode)}
                         {...this.bindingAttributes(vnode, "oninput", "value")}
                         className={classnames(styles.formControl, styles.inline)}/>;

    return [input, PasswordField.resetOrOverride(vnode)];
  }

  protected defaultAttributes(vnode: m.Vnode<FormFieldAttrs<EncryptedValue>>): { [p: string]: any } {
    const defaultAttributes = super.defaultAttributes(vnode);
    if (!vnode.attrs.property().isEditing()) {
      defaultAttributes.readonly = true;
    }
    return defaultAttributes;
  }

  protected bindingAttributes(vnode: m.Vnode<FormFieldAttrs<EncryptedValue>>,
                              eventName: string,
                              propertyAttribute: string) {

    if (vnode.attrs.property().isEditing()) {
      return {
        [eventName]: (evt: any) => vnode.attrs.property().value(evt.currentTarget.value),
        [propertyAttribute]: vnode.attrs.property().value()
      };
    } else {
      return {
        value: "************"
      };
    }
  }

  private static resetOrOverride(vnode: m.Vnode<FormFieldAttrs<EncryptedValue>>) {
    if (vnode.attrs.property().isEditing()) {
      return <FormResetButton
        onclick={vnode.attrs.property().resetToOriginal.bind(vnode.attrs.property())}>Reset</FormResetButton>;
    } else {
      return <FormResetButton
        onclick={vnode.attrs.property().edit.bind(vnode.attrs.property())}>Change</FormResetButton>;
    }
  }
}

export class TextAreaField extends FormField<string> {
  renderInputField(vnode: m.Vnode<FormFieldAttrs<string>>) {

    const defaultAttributes = this.defaultAttributes(vnode);

    const value = defaultAttributes.value;

    delete defaultAttributes.value;

    return (
      <textarea
        {...defaultAttributes}
        {...this.bindingAttributes(vnode, "onchange", "value")}
        className={classnames(styles.formControl, styles.textArea)}
        id={this.id}>{value}</textarea>
    );
  }
}

export class CheckboxField extends FormField<boolean> {
  view(vnode: m.Vnode<FormFieldAttrs<boolean>>) {

    return (
      <li className={classnames(styles.formGroup, {[styles.formHasError]: this.hasErrorText(vnode)})}>
        <div className={styles.formCheck}>
          {this.renderInputField(vnode)}
          {this.renderLabel(vnode)}
          {this.errorSpan(vnode)}
          {this.getHelpSpan(vnode)}
        </div>
      </li>
    );
  }

  renderInputField(vnode: m.Vnode<FormFieldAttrs<boolean>>): m.Children {
    return (
      <input type="checkbox"
             {...this.defaultAttributes(vnode)}
             {...this.bindingAttributes(vnode, "onchange", "checked")}
             className={this.className(vnode)}/>
    );
  }

  protected labelClass(): string {
    return styles.formCheckLabel;
  }

  protected className(vnode: m.Vnode<FormFieldAttrs<boolean>>): string {
    return classnames(this.defaultAttributes(vnode).className, styles.formCheckInput);
  }
}

export class Switch extends FormField<boolean> {
  renderInputField(vnode: m.Vnode<FormFieldAttrs<boolean>>): m.Children {
    return <SwitchBtn small={vnode.attrs.small} field={vnode.attrs.property}/>;
  }

  protected className(vnode: m.Vnode<FormFieldAttrs<boolean>>): string {
    return classnames(this.defaultAttributes(vnode).className, styles.formControl);
  }
}

export class SelectField extends FormField<string> {
  renderInputField(vnode: m.Vnode<FormFieldAttrs<string>>): m.Children {
    return (
      <select
        class={styles.formControl}
        {...this.defaultAttributes(vnode)}
        {...this.bindingAttributes(vnode, "onchange", "value")}>
        {vnode.children}
      </select>
    );
  }
}

export interface Option {
  id: string;
  text: string;
}

export interface SelectFieldAttrs {
  items: Array<Option | string>;
  selected?: string;
}

export class SelectFieldOptions extends MithrilViewComponent<SelectFieldAttrs> {
  view(vnode: m.Vnode<SelectFieldAttrs>): m.Children {
    return _.map(vnode.attrs.items, (optionOrString: Option | string) => {
      let id: string;
      let text: string;
      if (typeof optionOrString === "string") {
        id   = optionOrString as string;
        text = optionOrString as string;
      } else {
        id   = (optionOrString as Option).id;
        text = (optionOrString as Option).text;
      }

      return <option key={id}
                     value={id}
                     selected={vnode.attrs.selected === id}>{text}</option>;
    });
  }
}
