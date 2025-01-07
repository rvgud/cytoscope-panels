import { PanelPlugin } from '@grafana/data';
import { CytoscopePanelOptions } from './types';
import { CytoscopePanel } from './components/CytoscopePanel';
export const plugin = new PanelPlugin<CytoscopePanelOptions>(CytoscopePanel).setPanelOptions((builder) => {
  builder
    .addSelect({
      settings: {
        options: [
          { label: 'breadthfirst', value: 'breadthfirst' },
          { label: 'circle', value: 'circle' },
          { label: 'concentric', value: 'concentric' },
          { label: 'grid', value: 'grid' },
          { label: 'preset', value: 'preset' },
          { label: 'random', value: 'random' },
          { label: 'cose', value: 'cose' },
        ],
      },
      path: 'typeOfLayout',
      name: 'Cytoscope Layout',
      description: 'Type of layout to create',

    })
    .addTextInput({
      path: 'groupingOrderOfLables',
      name: 'Grouping Node Labels Order',
      description: 'Order Of labels from query to create grouping',
      defaultValue: '',
    })
    .addTextInput({
      path: 'layoutOptions',
      name: 'Layout Options',
      description: 'Provide options specific to the selected layout (JSON format)',
      showIf: (options) => !!options.typeOfLayout,
      settings: {useTextarea: true},
    });
    return builder
});
