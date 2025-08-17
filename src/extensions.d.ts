declare module "*.module.scss" {
    const styles: {
        readonly [className: string]: string;
    };
    
    export default styles;
}

declare module "*.module.css" {
    const styles: {
        readonly [className: string]: string;
    };

    export default styles;
}

declare module "*.css" {
    const filePath: string;
    export default filePath;
}

declare module "*.scss" {
    const filePath: string;
    export default filePath;
}
