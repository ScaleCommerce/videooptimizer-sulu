// @flow
import {viewRegistry} from 'sulu-admin-bundle/containers';
import {initializer} from 'sulu-admin-bundle/services';
import fieldRegistry from 'sulu-admin-bundle/containers/Form/registries/fieldRegistry';
import Settings from './views/Settings';
import Libraries from './views/Libraries';
import Videos from './views/Videos';
import VideoOptimizerField from './fields/VideoOptimizerField';
import {setPermissions} from './services/permissions';
import './styles.css';

// Custom admin views for the VideoOptimizer settings and library management.
viewRegistry.add('scale_videooptimizer_settings', Settings);
viewRegistry.add('scale_videooptimizer_libraries', Libraries);
viewRegistry.add('scale_videooptimizer_videos', Videos);

// The server tells which VideoOptimizer actions the current user may use (hides the rest).
initializer.addUpdateConfigHook('scale_videooptimizer', (config) => {
    setPermissions(config ? config.permissions : null);
});

// Content field type used by the `video_optimizer` property in page templates.
fieldRegistry.add('video_optimizer', VideoOptimizerField);
