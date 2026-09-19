import type { ContraBooksApp } from '../../app/types';

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
      component: () => import('./pages/TemplateGallery.vue'),
    },
    {
      path: '/template-builder',
      name: 'Template Builder',
      component: () => import('./pages/TemplateDesignerWindow.vue'),
      props: { name: 'Professional Invoice' },
    },
    {
      path: '/template-builder/:name',
      name: 'Template Builder Editor',
      component: TemplateDesignerWindow,
      props: true,
    },
    {
      path: '/template-designer/:name',
      name: 'Visual Template Designer',
      component: TemplateDesignerWindow,
      props: true,
    },
  ],
};
