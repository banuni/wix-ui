import * as React from 'react';
import {Simulate} from 'react-dom/test-utils';
import {queryHook} from 'wix-ui-test-utils/dom';
import {Popover, PopoverProps} from './';
import {createModifiers} from './modifiers';
import {popoverDriverFactory} from './Popover.driver';
import {ReactDOMTestContainer} from '../../../test/dom-test-container';
import * as eventually from 'wix-eventually';
import styles from './Popover.st.css';

function delay(millis: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, millis));
}

const popoverWithProps = (props: PopoverProps, content: string = 'Content') => (
  <Popover {...props}>
    <Popover.Element>
      <div>Element</div>
    </Popover.Element>
    <Popover.Content>
      <div>{content}</div>
    </Popover.Content>
  </Popover>
);

// Since Popover.Content can render outside the component's root, let's query
// the entire document with the assumption that we don't render more than one
// popover at a time.
const queryPopoverElement = () => queryHook<HTMLElement>(document, 'popover-element');
const queryPopoverContent = () => queryHook<HTMLElement>(document, 'popover-content');
const queryPopoverArrow   = () => queryHook<HTMLElement>(document, 'popover-arrow');
const queryPopoverPortal  = () => queryHook<HTMLElement>(document, 'popover-portal');

describe('Popover', () => {
  const container = new ReactDOMTestContainer().destroyAfterEachTest();
  const createDriver = container.createLegacyRenderer(popoverDriverFactory);

  describe('Display', () => {
    it(`doesn't display popup when shown={false}`, async () => {
      await container.render(popoverWithProps({
        placement: 'bottom',
        shown: false
      }));

      expect(queryPopoverElement()).toBeTruthy();
      expect(queryPopoverContent()).toBeNull();
    });

    it(`displays popup when shown={true}`, async () => {
      await container.render(popoverWithProps({
        placement: 'bottom',
        shown: true
      }));

      expect(queryPopoverContent()).toBeTruthy();
    });
  });

  describe('Events', () => {
    it(`calls mouseEnter and mouseLeave callbacks`, async () => {
      const onMouseEnter = jest.fn();
      const onMouseLeave = jest.fn();
      await container.render(popoverWithProps({
        placement: 'bottom',
        shown: false,
        onMouseEnter,
        onMouseLeave,
      }));

      Simulate.mouseEnter(container.componentNode);
      Simulate.mouseLeave(container.componentNode);
      expect(onMouseEnter).toBeCalled();
      expect(onMouseLeave).toBeCalled();
    });

    describe('onClickOutside', () => {
      it('should be triggered when outside of the popover is called', () => {
        const onClickOutside = jest.fn();

        const driver = createDriver(popoverWithProps({
          placement: 'bottom',
          shown: false,
          onClickOutside,
        }));

        driver.clickOutside();

        expect(onClickOutside).toBeCalled();
      });

      it('should not be triggered when content is clicked and appended to parent', async () => {
        const onClickOutside = jest.fn();

        await container.render(popoverWithProps({
          placement: 'bottom',
          shown: true,
          onClickOutside,
          appendTo: 'parent',
        }));

        Simulate.click(queryPopoverContent());

        expect(onClickOutside).not.toBeCalled();
      });

      it('should be triggered when content is clicked and not appended to parent', async () => {
        const onClickOutside = jest.fn();

        await container.render(popoverWithProps({
          placement: 'bottom',
          shown: true,
          onClickOutside,
          appendTo: 'viewport',
        }));

        Simulate.click(queryPopoverContent());

        expect(onClickOutside).not.toBeCalled();
      });
    });
  });

  describe('Position', () => {
    let updatePositionSpy;

    beforeEach(() => {
      updatePositionSpy = jest.spyOn(Popover.prototype, 'updatePosition');
    });

    afterEach(() => {
      updatePositionSpy.mockRestore();
    });

    it(`offsets the popup arrow by specified amount`, async () => {
      await container.render(popoverWithProps({
        placement: 'bottom',
        shown: true,
        showArrow: true,
        moveArrowTo: 10
      }));

      expect(queryPopoverArrow().style.left).toBe('10px');
    });

    it(`should update popper's position when props are chaning`, async () => {
       await container.render(popoverWithProps({
        placement: 'bottom',
        shown: true
      }, 'Old Content!'));

       await container.render(popoverWithProps({
        placement: 'bottom',
        shown: true
      }, 'New content!'));

       // Should have been called for each update
      expect(updatePositionSpy).toHaveBeenCalledTimes(2);
    });

    it(`should not directly update popper's position when the visibillity hasn't changed`, async () => {
       await container.render(popoverWithProps({
        placement: 'bottom',
        hideDelay: 10,
        showDelay: 10,
        shown: false,
      }));

       await container.render(popoverWithProps({
        placement: 'bottom',
        hideDelay: 10,
        showDelay: 10,
        shown: true,
      }));

       await container.render(popoverWithProps({
        placement: 'bottom',
        hideDelay: 10,
        showDelay: 10,
        shown: false,
      }));

      expect(updatePositionSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('Animation and delay', () => {
    it(`animates on close given a timeout`, async () => {
      await container.render(popoverWithProps(
        {placement: 'bottom', shown: true, timeout: 10}
      ));

      await container.render(popoverWithProps(
        {placement: 'bottom', shown: false, timeout: 10}
      ));

      expect(queryPopoverContent()).toBeTruthy();
      await eventually(() => {
        expect(queryPopoverContent()).toBeNull();
      }, {interval: 1});
    });

    it(`doesn't animate on close when timeout={0}`, async () => {
      await container.render(popoverWithProps(
        {placement: 'bottom', shown: true, timeout: 0}
      ));

      await container.render(popoverWithProps(
        {placement: 'bottom', shown: false, timeout: 0}
      ));

      expect(queryPopoverContent()).toBeNull();
    });

    it(`doesn't animate on close when timeout is an object with 0 values`, async () => {
      await container.render(popoverWithProps({
        placement: 'bottom',
        shown: true,
        timeout: { enter: 0, exit: 0 }
      }));

      await container.render(popoverWithProps({
        placement: 'bottom',
        shown: false,
        timeout: { enter: 0, exit: 0 }
      }));

      expect(queryPopoverContent()).toBeNull();
    });

    it(`should close after hideDelay`, async () => {
      await container.render(popoverWithProps({
        placement: 'bottom',
        hideDelay: 10,
        shown: true,
      }));

      await container.render(popoverWithProps({
        placement: 'bottom',
        hideDelay: 10,
        shown: false,
      }));

      expect(queryPopoverContent()).toBeTruthy();
      await eventually(() => {
        expect(queryPopoverContent()).toBeNull();
      }, {interval: 10});
    });

    it(`should open after showDelay`, async () => {
      await container.render(popoverWithProps({
        placement: 'bottom',
        showDelay: 10,
        shown: false,
      }));

      await container.render(popoverWithProps({
        placement: 'bottom',
        showDelay: 10,
        shown: true,
      }));

      expect(queryPopoverContent()).toBeNull();
      await eventually(() => {
        expect(queryPopoverContent()).toBeTruthy();
      }, {interval: 10});
    });

    it(`should reset timeout when state has changed`, async () => {
      await container.render(popoverWithProps({
        placement: 'bottom',
        hideDelay: 10,
        showDelay: 10,
        shown: false,
      }));

      await container.render(popoverWithProps({
        placement: 'bottom',
        hideDelay: 10,
        showDelay: 10,
        shown: true,
      }));

      await container.render(popoverWithProps({
        placement: 'bottom',
        hideDelay: 10,
        showDelay: 10,
        shown: false,
      }));

      expect(queryPopoverContent()).toBeNull();
      await delay(15);
      expect(queryPopoverContent()).toBeNull();
    });

    it(`should not update delay until the popover visibillity has fully changed`, async () => {
      await container.render(popoverWithProps({
        placement: 'bottom',
        hideDelay: 10,
        shown: true,
      }));

      await container.render(popoverWithProps({
        placement: 'bottom',
        hideDelay: 10,
        shown: false,
      }));

      await container.render(popoverWithProps({
        placement: 'bottom',
        hideDelay: 1000,
        shown: false,
      }));

      expect(queryPopoverContent()).toBeTruthy();

      // Making sure the popover is closed after the first `hideDelay` (10ms), and not the second
      // one (1000ms)
      await delay(10);
      expect(queryPopoverContent()).toBeNull();
    });

    it(`should show the popover immediately on first render if needed`, async () => {
      await container.render(popoverWithProps({
        placement: 'bottom',
        showDelay: 10,
        shown: true,
      }));

      expect(queryPopoverContent()).toBeTruthy();
    });

    it(`should show the popover immediately when delays are 0`, async () => {
      await container.render(popoverWithProps({
        placement: 'bottom',
        hideDelay: 0,
        showDelay: 0,
        shown: false,
      }));

      expect(queryPopoverContent()).toBeNull();

      await container.render(popoverWithProps({
        placement: 'bottom',
        hideDelay: 0,
        showDelay: 0,
        shown: true,
      }));

      expect(queryPopoverContent()).toBeTruthy();

      // Close again the popover
      await container.render(popoverWithProps({
        placement: 'bottom',
        hideDelay: 0,
        showDelay: 0,
        shown: false,
      }));

      expect(queryPopoverContent()).toBeNull();
    });
  });

  describe('Portal and containment', () => {
    const portalContainer = new ReactDOMTestContainer().destroyAfterEachTest();

    it(`renders the popup directly into the popover root by default`, async() => {
      await container.render(popoverWithProps({
        placement: 'bottom',
        shown: true
      }));

      expect(queryPopoverContent().parentElement).toBe(container.componentNode);
    });

    it(`renders the popup into a portal when given appendTo prop`, async() => {
      await container.render(popoverWithProps({
        placement: 'bottom',
        shown: true,
        appendTo: portalContainer.node
      }));

      expect(queryPopoverContent().parentElement).toBe(queryPopoverPortal());
      expect(queryPopoverPortal().parentElement).toBe(portalContainer.node);
      expect(queryPopoverPortal().classList).toContain(styles.root);
    });

    it(`renders an empty portal when closed`, async() => {
      await container.render(popoverWithProps({
        placement: 'bottom',
        shown: false,
        appendTo: portalContainer.node
      }));

      expect(queryPopoverContent()).toBeNull();
      expect(queryPopoverPortal().parentElement).toBe(portalContainer.node);
      expect(queryPopoverPortal().classList).not.toContain(styles.root);
    });

    it(`removes the portal on unmount`, async() => {
      await container.render(popoverWithProps({
        placement: 'bottom',
        shown: true,
        appendTo: portalContainer.node
      }));

      expect(queryPopoverPortal()).toBeTruthy();
      container.unmount();
      expect(queryPopoverPortal()).toBeNull();
    });

    it(`adds the portal to the body when appendTo="window"`, async () => {
      await container.render(popoverWithProps({
        placement: 'bottom',
        shown: true,
        appendTo: 'window'
      }));

      expect(queryPopoverPortal().parentElement).toBe(document.body);
    });

    it(`adds the portal to the closest scrollable element when appendTo="scrollParent"`, async () => {
      await container.render(
        <div style={{overflow: 'scroll'}}>
          <div style={{overflow: 'visible'}}>
            {popoverWithProps({
              placement: 'bottom',
              appendTo: 'scrollParent',
              shown: true
            })}
          </div>
        </div>
      );

      expect(queryPopoverPortal().parentElement).toBe(container.node.firstChild);
    });

    it(`adds the portal next to the popover's element when appendTo="parent"`, async () => {
      await container.render(popoverWithProps({
        placement: 'bottom',
        shown: true,
        appendTo: 'parent'
      }));

      expect(queryPopoverContent().parentElement).toBe(queryPopoverElement().parentElement);
    });

    it(`should update the portal's styles when updated`, async () => {
      // First render without passing the `className` prop, the <Popover/>
      // portal should only have the root class applied.
      await container.render(popoverWithProps({
        placement: 'bottom',
        shown: true,
        appendTo: portalContainer.node
      }));

      // Second render with a `className` prop. Stylable `style()` function
      // should apply it.
      await container.render(popoverWithProps({
        placement: 'bottom',
        shown: true,
        appendTo: portalContainer.node,
        className: 'some-class'
      }));

      expect(queryPopoverPortal().classList).toContain('some-class');
    });

    it(`should not remove styles until unmounted with hideDelay`, async() => {
      await container.render(popoverWithProps({
        placement: 'bottom',
        shown: true,
        hideDelay: 10,
        appendTo: portalContainer.node
      }));

      await container.render(popoverWithProps({
        placement: 'bottom',
        shown: false,
        hideDelay: 10,
        appendTo: portalContainer.node
      }));

      expect(queryPopoverPortal()).toBeTruthy();
      expect(queryPopoverPortal().classList).toContain(styles.root);

      await delay(10);
      expect(queryPopoverPortal().classList).not.toContain(styles.root);
    });
  });

  describe('React <16 compatibility', () => {
    it('should wrap children in a <div/> if provided as strings to support React 15', async () => {
      await container.render(
        <Popover shown placement="bottom">
          <Popover.Element>Element</Popover.Element>
          <Popover.Content>Content</Popover.Content>
        </Popover>
      );

      expect(queryPopoverElement().childNodes[0].nodeName).toEqual('DIV');
      expect(queryPopoverContent().childNodes[0].nodeName).toEqual('DIV');
    });
  });

  describe('createModifiers', () => {
    const defaultProps = {
      moveBy: undefined,
      appendTo: undefined,
      shouldAnimate: false,
      flip: true,
      fixed: false,
      placement: 'bottom',
      isTestEnv: false,
    };

    it('should match default modifiers', () => {
      const modifiers = createModifiers({
        ...defaultProps,
      });

      expect(modifiers).toEqual({
        offset: {
          offset: '0px, 0px',
        },
        computeStyle: {
          gpuAcceleration: true,
        },
        flip: {
          enabled: true,
        },
        preventOverflow: {
          enabled: true,
        },
        hide: {
          enabled: true,
        },
      });
    });

    it('should calculate the offset properly using moveBy for the top placement', () => {
      const modifiers = createModifiers({
        ...defaultProps,
        moveBy: { x: 5, y: 10 },
        placement: 'top',
      });

      expect(modifiers.offset.offset).toEqual('5px, 10px');
    });

    it('should calculate the offset properly using moveBy for the right placement', () => {
      const modifiers = createModifiers({
        ...defaultProps,
        moveBy: { x: 5, y: 10 },
        placement: 'right',
      });

      expect(modifiers.offset.offset).toEqual('10px, 5px');
    });

    it('should disable gpuAcceleration when animation is enabled', () => {
      const modifiers = createModifiers({
        ...defaultProps,
        shouldAnimate: true,
      });

      expect(modifiers.computeStyle.gpuAcceleration).toEqual(false);
    });

    it('should disable the flip modifier if moveBy was provided', () => {
      const modifiers = createModifiers({
        ...defaultProps,
        moveBy: { x: 5, y: 10 },
      });

      expect(modifiers.flip.enabled).toEqual(false);
    });

    it('should disable the flip modifier when set explicitly', () => {
      const modifiers = createModifiers({
        ...defaultProps,
        flip: false
      });

      expect(modifiers.flip.enabled).toEqual(false);
    });

    it('should disable `preventOverflow` and `hide` when fixed set to `true`', () => {
      const modifiers = createModifiers({
        ...defaultProps,
        fixed: true
      });

      expect(modifiers.preventOverflow.enabled).toEqual(false);
      expect(modifiers.hide.enabled).toEqual(false);
    });

    it('should disable computeStyle when isTestEnv is set to `true`', () => {
      const modifiers = createModifiers({
        ...defaultProps,
        isTestEnv: true,
      });

      expect(modifiers.computeStyle.enabled).toEqual(false);
    });

    it('should set boundariesElement when appendTo is provided', () => {
      const modifiers = createModifiers({
        ...defaultProps,
        appendTo: 'viewport',
      });

      expect(modifiers.preventOverflow.boundariesElement).toEqual('viewport');
    });
  });
});
