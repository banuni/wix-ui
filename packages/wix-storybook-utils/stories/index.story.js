import React from 'react';
import Component from './component';
import CodeShowcase from '../src/CodeShowcase/';
import LiveCodeExample from '../src/LiveCodeExample';

// Taking the whole wsr library for the code example test
import * as wsrScope from 'wix-style-react';

const showcase = `<button className={button.one}>one</button>
<button className={button.two}>two</button>
<button className={button.three}>three</button>`;

const ExampleShowcase = () => (
  <CodeShowcase title="CodeShowcase" code={showcase}>
    <button style={{marginRight: '5px'}}>one</button>
    <button style={{marginRight: '5px'}}>two</button>
    <button style={{marginRight: '5px'}}>three</button>
  </CodeShowcase>
);

export default {
  category: 'Components',
  storyName: 'Dummy Component',

  component: Component,
  componentPath: './component.js',

  componentProps: {
    // test should be visible even though it's not part of component propTypes
    test: 'im a test',

    enabled: true,
    bigFunction(argument1, argument2, ...rest) {
      const text = `${argument1} with ${argument2} are good friends`;

      return rest.map(n => {
        const upper = n.toUpperCase();
        return upper.repeat(5) + text;
      });
    }
  },

  exampleProps: {
    onClick: () => 'hai'
  },

  hiddenProps: ['propNotVisibleInStorybook'],

  examples: (
    <div>
      <ExampleShowcase/>

      <LiveCodeExample
        scope={wsrScope}
        title="Live code example" initialCode={`
/* This is just a big example to test the live editor */
<div>
  <Dropdown
    placeholder="Select dominant hand"
    options={[
      {id: 0, value: 'Left'},
      {id: 1, value: 'Right'},
      {id: 2, value: 'Ambidextrous'}
    ]}
  />

  <br/>

  <Heading>This is a live preview!</Heading>
  <Heading>This is a live preview!</Heading>
  <Heading>This is a live preview!</Heading>

  <br/>

  <Card>
    <Card.Header
        title="Even Cards!"
        suffix={
          <Button
            onClick={() => alert('Clicked!')}
            height="small"
            theme="fullblue"
            children="New Image"
            />
        }
        />

      <Card.Content>
        <EmptyState
          title="You don't have any images yet"
          subtitle="'member EmptyState?"
          children={<TextLink>Add image</TextLink>}
          />
      </Card.Content>
    </Card>

  <br/>

  <Tooltip content="Even tooltip works!">
    <span>Hover me!</span>
  </Tooltip>

  <br/>
  <br/>

  <Button>Click me!</Button>
</div>
      `}/>
    </div>
  )
};
