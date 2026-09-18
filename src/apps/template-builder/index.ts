import type { ContraBooksApp } from '../../app/types';
import TemplateDesignerWindow from './pages/TemplateDesignerWindow.vue';
import TemplateGallery from './pages/TemplateGallery.vue';

export const templateBuilderApp: ContraBooksApp = {
  manifest: {
    id: 'contrabooks.template-builder',
    name: 'Template Builder',
    version: '1.0.0',
    description: 'Visual document template design and printing.',
    enabledByDefault: true,
    bundled: true,
    localOnly: true,
    permissions: ['documents.read', 'documents.write', 'printing'],
  },
  routes: [
    {
      path: '/template-builder/manage',
      name: 'Template Gallery',
      component: TemplateGallery,
    },
    {
      path: '/template-builder',
      name: 'Template Builder',
      component: TemplateDesignerWindow,
      props: { name: 'Professional Invoice' },
    },
    {
      path: '/template-designer/:name',
      name: 'Visual Template Designer',
      component: TemplateDesignerWindow,
      props: true,
    },
  ],
};
