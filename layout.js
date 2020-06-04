registerLayout(
  "video-gallery",
  class {
    static get inputProperties() {
      return [];
    }

    static get layoutOptions() {
      return {
        childDisplay: "block",
        sizing: "manual"
      };
    }

    async intrinsicSizes() {}

    async layout(children, edges, constraints, styleMap) {
      const containerWidth = constraints.fixedInlineSize;
      const containerHeight = constraints.fixedBlockSize;

      const { width, height, cols, rows } = calculateLayout(
        containerWidth,
        containerHeight,
        children.length,
        16 / 9
      );

      // layout video containers using manually calculated fixed width / height
      const childFragments = await Promise.all(
        children.map(child => {
          return child.layoutNextFragment({
            fixedInlineSize: width,
            fixedBlockSize: height
          });
        })
      );

      // position videos inside gallery
      for (let i = 0; i < childFragments.length; i++) {
        const currentCol = i % cols;
        const currentRow = Math.floor(i / cols);

        // last row could be not completely filled in
        const colsInCurrentRow =
          currentRow + 1 === rows
            ? cols - (rows * cols - childFragments.length)
            : cols;

        const occupiedWidth = width * colsInCurrentRow;
        const occupiedHeight = height * rows;

        const wGap = (containerWidth - occupiedWidth) / 2;
        const hGap = (containerHeight - occupiedHeight) / 2;
        childFragments[i].inlineOffset = wGap + currentCol * width;
        childFragments[i].blockOffset = hGap + currentRow * height;
      }
      return { childFragments };
    }
  }
);

// same function as in original solution without layout worklet
// https://dev.to/antondosov/building-a-video-gallery-just-like-in-zoom-4mam
function calculateLayout(
  containerWidth,
  containerHeight,
  videoCount,
  aspectRatio
) {
  let bestLayout = {
    area: 0,
    cols: 0,
    rows: 0,
    width: 0,
    height: 0
  };

  // brute-force search layout where video occupy the largest area of the container
  for (let cols = 1; cols <= videoCount; cols++) {
    const rows = Math.ceil(videoCount / cols);
    const hScale = containerWidth / (cols * aspectRatio);
    const vScale = containerHeight / rows;
    let width;
    let height;
    if (hScale <= vScale) {
      width = Math.floor(containerWidth / cols);
      height = Math.floor(width / aspectRatio);
    } else {
      height = Math.floor(containerHeight / rows);
      width = Math.floor(height * aspectRatio);
    }
    const area = width * height;
    if (area > bestLayout.area) {
      bestLayout = {
        area,
        width,
        height,
        rows,
        cols
      };
    }
  }
  return bestLayout;
}
