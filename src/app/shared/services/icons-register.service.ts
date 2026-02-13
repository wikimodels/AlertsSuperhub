import { Injectable, inject } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { ICONS_LIST } from '../constants/icons-list';

@Injectable({
  providedIn: 'root',
})
export class IconsRegisterService {
  private iconRegistry = inject(MatIconRegistry);
  private sanitizer = inject(DomSanitizer);

  /**
   * Registers all SVG icons with Angular Material's MatIconRegistry.
   * Returns a Promise for compatibility with APP_INITIALIZER.
   */
  public registerIcons(): Promise<void> {
    if (!ICONS_LIST || ICONS_LIST.length === 0) {
      console.warn('⚠️ No icons found in ICONS_LIST constant');
      return Promise.resolve();
    }

    ICONS_LIST.forEach((iconName) => {
      this.iconRegistry.addSvgIcon(
        iconName,
        this.sanitizer.bypassSecurityTrustResourceUrl(`assets/icons/${iconName}.svg`)
      );
    });

    console.log(`✅ Registered ${ICONS_LIST.length} icons successfully.`);

    return Promise.resolve();
  }
}
