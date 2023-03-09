/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ORIGIN_TYPE } from './config';
import { startFor } from './contentUtils.js';

// Pathnames that do not currently have messaging enabled and are not BT
// compliant/
// NOTE: All pathnames checked against this list will be surrounded by '/'
const EXCLUDED_PATHNAMES: Array<string | RegExp> = [
  /**
   * Settings
   */
  '/settings/',
  /\/[^/]+?\/settings\/$/, // Page settings

  /**
   * Games
   */
  '/games/',
  // Anything in the /games pathname except /games/instantgames/
  /\/games\/(?:(?!instantgames\/)).*$/,
  '/gaming/games/',
  // Anything in the /gaming/games pathname except /gaming/games/instantgames/
  /\/gaming\/games\/(?:(?!instantgames\/)).*$/,

  /**
   * Share plugin
   */
  '/sharer.php/',
  '/sharer/',
  /\/sharer\/sharer.php.*$/,

  /**
   * Like plugin
   */
  // e.g. /v2.5/plugins/like.php
  /\/v[\d.]+\/plugins\/like.php\/.*$/,

  /**
   * Help center articles
   */
  /\/help\/.*$/,

  /**
   * Marketplace
   */
  '/marketplace/you/sales/confirm_identity/',
];

startFor(ORIGIN_TYPE.FACEBOOK, EXCLUDED_PATHNAMES);
