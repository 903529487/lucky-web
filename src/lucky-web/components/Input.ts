import * as React from 'react'
import {Node, BaseProps, RevasTouchEvent} from '../core/Node'
import {useCallback, useEffect, useRef, useState} from "react";
import {RevasCanvas} from "../core/Canvas";
import Click from "./common/click";
import Text from "./Text";
import canvasUtils from "./common/canvasUtils";

export type IInput = {
    value?: string
    onGetValue?: Function;
} & BaseProps;

const click = new Click()

export default function Input(props: IInput) {
    const {style, value} = props;
    const [op, setOp] = useState({opacity: 1})
    const [isShowLabel, setIsShowLabel] = useState<boolean>(false)
    const [text, setText] = useState<string>(value || '')
    //容器宽度
    const [boxWidth, setBoxWidth] = useState<number>(style?.width || 400)
    const [textWidth, setTextWidth] = useState<number>(0)
    const [textLeft, setTextLeft] = useState<number>(0)
    const oldY = useRef(0);
    const oldW = useRef(0);
    const input = useRef<any>(null)

    useEffect(() => {
        input.current = document.createElement('input');
        input.current.id = 'input-' + Date.now()
        input.current.value = text
        document.body.appendChild(input.current)
        input.current.addEventListener('input', getValue)
        input.current.addEventListener('focus', showLabel)
        input.current.addEventListener('blur', hideLabel)
        return () => {
            input.current.removeEventListener('input', getValue)
            input.current.removeEventListener('focus', showLabel)
            input.current.removeEventListener('blur', hideLabel)
            document.body.removeChild(input.current)
            input.current = null
        }
    }, [])

    // 定时器光标
    const intervalRef = useRef<any>(null)
    useEffect(() => {
        if(isShowLabel){
            intervalRef.current = setInterval(() => {
                setOp({opacity: op.opacity ? 0 : 1})
            }, 500)
        }

        return () => {
            intervalRef?.current && clearInterval(intervalRef.current)
        }
    }, [op,isShowLabel])

    //计算光标位置
    useEffect(() => {
        const charWidth = canvasUtils.getActualWidthOfChars(text, {
            size: style.fontSize || 30
        })
        if (oldW.current !== charWidth) {
            if (boxWidth - 20 < charWidth) {
                setTextLeft(charWidth - boxWidth + 20 + 2)
                setTextWidth(boxWidth - 20)
            } else {
                setTextLeft(0)
                setTextWidth(charWidth)
            }
            oldW.current = charWidth
        }
    }, [text])


    const getValue = (e: any) => {
        setText(e.target.value)
        props.onGetValue && props.onGetValue(e.target.value)
    }
    const showLabel = useCallback(() => {
        setIsShowLabel(true)
    }, [])

    const hideLabel = useCallback(() => {
        setIsShowLabel(false)
    }, [])


    const _customDrawer = (canvas: RevasCanvas, node: Node) => {
        //有动画会一直执行，需要做新旧数据判断处理
        if (input?.current) {
            if (node?.frame?.y !== oldY?.current) {
                input.current.style.position = "fixed";
                oldY.current = node.frame.y
                input.current.style.top = node.frame.y * (document.body.clientWidth / 750) + "px"
                input.current.style.left = "-100%"
            }

        }
    }


    const onPress = () => {
        input.current.focus()
    };


    const childList: any = [
        React.createElement(Text, {
            key: 'InputText',
            style: {
                width: '100%',
                // backgroundColor: '#ccc',
                paddingLeft: 10,
                paddingRight: 10,
                fontSize: style?.fontSize || 30,
                wordBreak: 'keep-all',
                position: 'absolute',
                left: -textLeft,

            },
        }, text),
    ]

    if (isShowLabel) {
        //光标
        childList.push(
            React.createElement('InputLabel', {
                key: 'InputLabel',
                style: [{
                    width: 2,
                    height: '60%',
                    backgroundColor: '#000',
                    position: 'absolute',
                    left: textWidth ? textWidth + 10 : 10,
                    top: '20%',
                }, op],
            }),
        )
    }

    return React.createElement('Input', {
            onTouchStart: (e: RevasTouchEvent) => {
                click.touchStart(e, () => {
                })
            },
            onTouchEnd: (e: RevasTouchEvent) => {
                click.touchEnd(e, onPress)
            },
            ...props,
            customDrawer: _customDrawer,
            style: {
                width: boxWidth,
                height: 60,
                borderWidth: 1,
                borderColor: '#999',
                borderRadius: 5,
                overflow: 'hidden',
                flexDirection: 'row',
                alignItems: 'center',
                position: 'relative',
                ...style
            },
        },
        childList
    )
}
