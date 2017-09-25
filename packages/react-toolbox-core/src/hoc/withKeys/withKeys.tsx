import * as React from 'react';
import { Component, ComponentClass, KeyboardEvent } from 'react';
import { keys } from 'ramda';
import * as KEYS from './keys';

const keyIs = key => (event: KeyboardEvent<any>) => event.keyCode === key;

export const BINDINGS = {
  ARROW_DOWN: keyIs(KEYS.ARROW_DOWN),
  ARROW_LEFT: keyIs(KEYS.ARROW_LEFT),
  ARROW_RIGHT: keyIs(KEYS.ARROW_RIGHT),
  ARROW_UP: keyIs(KEYS.ARROW_UP),
  BACKSPACE: keyIs(KEYS.BACKSPACE),
  COMMA: keyIs(KEYS.COMMA),
  ENTER_OR_SPACEBAR: e => keyIs(KEYS.ENTER)(e) || keyIs(KEYS.SPACEBAR)(e),
  ENTER: keyIs(KEYS.ENTER),
  ESC: keyIs(KEYS.ESC),
  SPACEBAR: keyIs(KEYS.SPACEBAR),
  TAB: keyIs(KEYS.TAB),
};

export type Handler<I> = (
  event: KeyboardEvent<any>,
  props: object,
  instance: I,
) => void | string;

export interface Handlers<I> {
  ARROW_LEFT?: Handler<I>;
  ARROW_RIGHT?: Handler<I>;
  ARROW_DOWN?: Handler<I>;
  ARROW_UP?: Handler<I>;
  BACKSPACE?: Handler<I>;
  ENTER?: Handler<I>;
  TAB?: Handler<I>;
  COMMA?: Handler<I>;
  ESC?: Handler<I>;
  SPACEBAR?: Handler<I>;
  ENTER_OR_SPACEBAR?: Handler<I>;
}

export interface WithKeysArgs<I> {
  handlers: Handlers<I>;
}

export interface WithKeysProps {
  useKeys?(): boolean;
}

export type WithKeysHOC = <T>(
  decorated: ComponentClass<T & WithKeysProps>,
) => ComponentClass<T>;

export default function withKeys<I>({
  handlers,
}: WithKeysArgs<I>): WithKeysHOC {
  return function<T>(DecoratedComponent) {
    return class WithKeysComponent extends Component<T & WithKeysProps, void> {
      rootNode: Component<T, any> | undefined;

      componentDidMount() {
        if (this.shouldAttach(this.props)) {
          document.addEventListener('keydown', this.handleKeyDown);
        }
      }

      componentDidUpdate() {
        if (this.shouldAttach(this.props)) {
          document.addEventListener('keydown', this.handleKeyDown);
        } else {
          document.removeEventListener('keydown', this.handleKeyDown);
        }
      }

      componentWillUnmount() {
        if (this.shouldAttach(this.props)) {
          document.removeEventListener('keydown', this.handleKeyDown);
        }
      }

      shouldAttach = (props: WithKeysProps) => props.useKeys && props.useKeys();

      handleRef = (node: Component<T, any>) => {
        this.rootNode = node;
      };

      handleKeyDown = event => {
        keys(handlers).forEach(bindingKey => {
          const binding = BINDINGS[bindingKey];
          const handler = handlers[bindingKey];

          if (binding && binding(event) && handler) {
            if (typeof handler === 'string' && this.rootNode) {
              this.rootNode[handler].call(
                this,
                event,
                this.props,
                this.rootNode,
              );
            }

            if (typeof handler !== 'string') {
              handler.call(this, event, this.props, this.rootNode);
            }
          }
        });
      };

      render() {
        const { useKeys, ...other } = this.props as any;
        return <DecoratedComponent ref={this.handleRef} {...other} />;
      }
    };
  };
}
