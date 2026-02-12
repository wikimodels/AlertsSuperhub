import { Directive, Input, HostListener, inject, ElementRef, OnInit } from '@angular/core';
import { Clipboard } from '@angular/cdk/clipboard';
import { MatTooltip } from '@angular/material/tooltip';

@Directive({
    selector: '[appCopyPrice]',
    standalone: true,
    hostDirectives: [
        {
            directive: MatTooltip,
            inputs: ['matTooltip:appCopyPriceTooltip'],
        },
    ],
})
export class CopyPriceDirective implements OnInit {
    @Input('appCopyPrice') price!: number;

    private clipboard = inject(Clipboard);
    private tooltip = inject(MatTooltip);
    private el = inject(ElementRef);

    ngOnInit() {
        // 1. Настраиваем тултип: только Copied!, позиция сверху, по умолчанию выключен
        this.tooltip.position = 'above';
        this.tooltip.message = 'Copied!';
        this.tooltip.disabled = true;
    }

    @HostListener('click', ['$event'])
    onClick(event: MouseEvent) {
        event.stopPropagation();

        if (this.price !== undefined) {
            const success = this.clipboard.copy(this.price.toString());
            if (success) {
                // Включаем, показываем и выключаем обратно
                this.tooltip.disabled = false;
                this.tooltip.show();

                setTimeout(() => {
                    this.tooltip.hide();
                    setTimeout(() => {
                        this.tooltip.disabled = true;
                    }, 500);
                }, 1500);
            }
        }
    }
}
