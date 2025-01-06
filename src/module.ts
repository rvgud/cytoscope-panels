import { PanelPlugin } from '@grafana/data';
import { CytoscopePanelOptions } from './types';
import { CytoscopePanel } from './components/CytoscopePanel';

export const plugin = new PanelPlugin<CytoscopePanelOptions>(CytoscopePanel).setPanelOptions((builder) => {
  return builder
    .addTextInput({
      path: 'orderOfLables',
      name: 'Order of labels',
      description: 'Order Of labels form query to create',
      defaultValue: '',
    });
});
