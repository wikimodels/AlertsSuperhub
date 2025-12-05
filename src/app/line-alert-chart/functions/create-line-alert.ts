import { LineAlert } from '../../models/alerts';
import { ChartLineObject } from '../../models/chart-line-object';

export function createLineAlertFromLine(
  symbol: string,
  exchanges: string[],
  category: number,
  lineObject: ChartLineObject
): LineAlert {
  return {
    symbol: symbol,
    alertName: `${symbol} @ ${lineObject.price.toFixed(4)}`,
    price: lineObject.price,
    description: `Alert is created at ${lineObject.price.toFixed(4)}`,
    exchanges: exchanges, // ✅ Real value
    category: category, // ✅ Real value
    id: lineObject.id,
    creationTime: new Date(lineObject.createdAt).getTime(),
    isActive: true,
    imagesUrls: [],
    color: lineObject.color,
  };
}
