import * as eyes from 'eyes.it';
import {browser} from 'protractor';
import {getStoryUrl, waitForVisibilityOf} from 'wix-ui-test-utils/protractor';
import {linearProgressBarTestkitFactory, LinearProgressBarDriver} from '../../testkit/protractor';
import {Key} from 'selenium-webdriver';
import * as autoExampleDriver from 'wix-storybook-utils/AutoExampleDriver';
import { LinearProgressBarProps } from './LinearProgressBar';

describe('LinearProgresBar', () => {
  const storyUrl = getStoryUrl('Components', 'LinearProgressBar');
  const dataHook = 'progress-bar';
  let driver: LinearProgressBarDriver;

  beforeAll(async () => {
    browser.get(storyUrl)
    driver = linearProgressBarTestkitFactory({dataHook});
    await waitForVisibilityOf(driver.element(), 'Cannot find LinearProgressBar');
  });

  beforeEach(async () => {
    driver = linearProgressBarTestkitFactory({dataHook});
    return autoExampleDriver.reset();
  });

  eyes.it('should progress as value increase', async () => {
    const expectedProgress = 90;

    await autoExampleDriver.setProps({value: expectedProgress});
    const foregroundBarWidth = await driver.getForegroundBarWidth();
    const backgroundBarWidth = await driver.getBackgroundBarWidth();
    const actualProgress = Math.round((foregroundBarWidth/backgroundBarWidth) * 100);

    expect(actualProgress).toBe(expectedProgress);
  });

  eyes.it('should show progress indicator', async () => {
    const props: LinearProgressBarProps = {showProgressIndication: true, value: 10};
    await autoExampleDriver.setProps(props);
    expect(await driver.isProgressIndicationDisplayed()).toBe(true);
  });
});